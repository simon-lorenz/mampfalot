'use strict'

const { Comment, Group, Place, Lunchbreak, User, GroupMembers, Participant, Vote, Invitation } = require('../models')
const { NotFoundError } = require('./errors')

class ResourceLoader {

	/**
	 * Loads a comment resource into res.locals.comment.
	 * This middleware requires the request to have the param 'commentId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadComment(req, res, next) {
		const commentId = parseInt(req.params.commentId)
		res.locals.comment = await Comment.findByPk(commentId)
		if (res.locals.comment) { next() }
		else { next(new NotFoundError('Comment', commentId)) }
	}

	/**
	 * Loads a group resource into res.locals.group.
	 * This middleware requires the request to have the param 'groupId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadGroup(req, res, next) {
		const groupId = parseInt(req.params.groupId)
		res.locals.group = await Group.findByPk(groupId, {
			include: [
				{
					model: Place,
					attributes: {
						exclude: ['groupId']
					},
					order: ['id']
				},
				{
					model: Lunchbreak,
					limit: parseInt(req.query.lunchbreakLimit) || 25,
					order: ['id']
				},
				{
					model: User,
					attributes: ['id', 'username', 'firstName', 'lastName'],
					as: 'members',
					through: {
						as: 'config',
						attributes: ['color', 'isAdmin']
					}
				},
				{
					model: Invitation,
					attributes: ['groupId'],
					include: [
						{
							model: Group,
							attributes: ['id', 'name']
						},
						{
							model: User,
							as: 'from',
							attributes: ['id', 'username', 'firstName', 'lastName']
						},
						{
							model: User,
							as: 'to',
							attributes: ['id', 'username', 'firstName', 'lastName']
						}
					]
				}
			]
		})

		if (!res.locals.group) {
			next(new NotFoundError('Group', groupId))
		} else {
			next()
		}
	}

	async loadInvitation(req, res, next) {
		const to = Number(req.query.to)
		const groupId = Number(req.params.groupId)

		res.locals.invitation = await Invitation.findOne({
			where: { groupId, toId: to }
		})

		if (res.locals.invitation) {
			next()
		} else {
			throw new NotFoundError('Invitation', null)
		}
	}

	/**
	 * Loads a group member resource into res.locals.member.
	 * This middleware requires the request to have the params 'groupId' and 'userId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadMember(req, res, next) {
		const groupId = parseInt(req.params.groupId)
		const userId = parseInt(req.params.userId)
		res.locals.member = await GroupMembers.findOne({
			where: { groupId, userId }
		})

		if (res.locals.member) {
			next()
		} else {
			throw new NotFoundError('GroupMember', userId)
		}
	}

	/**
	 * Loads a lunchbreak resource into res.locals.lunchbreak.
	 * This middleware requires the request to have the param 'lunchbreakId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadLunchbreak (req, res, next) {
		const lunchbreakId = parseInt(req.params.lunchbreakId)

		res.locals.lunchbreak = await Lunchbreak.findByPk(lunchbreakId, {
			include: [
				{
					model:Participant,
					attributes: {
						exclude: ['amountSpent']
					},
					include: [
						{
							model:Vote,
							include: [ Place ]
						},
						{
							model: User
						}]
				},
				{
					model: Comment
				}
			]
		})

		if (res.locals.lunchbreak) {
			next()
		} else {
			next(new NotFoundError('Lunchbreak', lunchbreakId))
		}
	}

	/**
	 * Loads a participant resource into res.locals.participant.
	 * This middleware requires the request to have the param 'participantId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadParticipant (req, res, next) {
		const participantId = parseInt(req.params.participantId)

		res.locals.participant = await Participant.findOne({
			attributes: {
				exclude: ['amountSpent']
			},
			where: {
				id: participantId
			},
			include: [
				{
					model: Vote,
					include: [Place]
				}, User, Lunchbreak
			]
		})

		if (res.locals.participant) {
			next()
		} else {
			next(new NotFoundError('Participant', participantId))
		}
	}

	/**
	 * Loads a place resource into res.locals.place.
	 * This middleware requires the request to have the param 'placeId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadPlace (req, res, next) {
		const placeId = parseInt(req.params.placeId)
		res.locals.place = await Place.findByPk(placeId, {
			include: [
				{
					model: Group
				}
			]
		})

		if (res.locals.place) {
			next()
		} else {
			next(new NotFoundError('Place', placeId))
		}
	}

	/**
	 * Loads a user resource into res.locals.resources.user.
	 * This middleware requires the request to have the param 'userId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadUser (req, res, next) {
		const userId = parseInt(req.params.userId)
		res.locals.resources = {}
		res.locals.resources.user = await User.unscoped().findByPk(userId)
		if (res.locals.resources.user) {
			return next()
		} else {
			return next(new NotFoundError('User', userId))
		}
	}

	/**
	 * Loads a vote resource into res.locals.vote.
	 * This middleware requires the request to have the param 'voteId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadVote (req, res, next) {
		const voteId = parseInt(req.params.voteId)
		res.locals.vote = await Vote.findByPk(voteId, {
			include: [ Participant, Place ]
		})

		if (res.locals.vote) {
			next()
		} else {
			next(new NotFoundError('Vote', voteId))
		}
	}

}

module.exports = new ResourceLoader()
