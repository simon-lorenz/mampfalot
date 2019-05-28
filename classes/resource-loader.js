'use strict'

const { Comment, Group, Place, Lunchbreak, User, GroupMembers, Participant, Vote, Invitation } = require('../models')
const { NotFoundError } = require('./errors')
const Op = require('sequelize').Op

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

	async getUserIdByUsername(username) {
		const user = await User.findOne({
			attributes: ['id'],
			where: {
				username
			}
		})

		if (user)
			return user.id
		else
			throw new NotFoundError('User', username)
	}

	async getUsernameById(userId) {
		const user = await User.findOne({
			attributes: ['username'],
			where: {
				id: userId
			}
		})

		if (user)
			return user.username
		else
			throw new NotFoundError('User', userId)
	}

	async loadUserById(userId) {
		const user = await User.findByPk(userId, {
			attributes: ['username', 'firstName', 'lastName']
		})

		if (user)
			return user
		else
			throw NotFoundError('User', userId)
	}

	async loadUserWithEmail(userId) {
		return await User.findOne({
			attributes: ['username', 'firstName', 'lastName', 'email'],
			where: {
				id: userId
			}
		})
	}

	async loadGroupById(id) {
		const group = await Group.findByPk(id, {
			include: [
				{
					model: Place,
					attributes: ['id', 'name', 'foodType']
				},
				{
					model: User,
					attributes: ['username', 'firstName', 'lastName'],
					as: 'members',
					through: {
						as: 'config',
						attributes: ['color', 'isAdmin']
					}
				},
			]
		})

		if (group)
			return group
		else
			throw new NotFoundError('Group', id)
	}

	async loadInvitation(groupId, toId) {
		const invitation = await Invitation.findOne({
			attributes: [],
			where: {
				toId, groupId
			},
			include: [
				{
					model: Group,
					include: [
						{
							model: Place,
							attributes: ['id', 'name', 'foodType']
						},
						{
							model: User,
							attributes: ['username', 'firstName', 'lastName'],
							as: 'members',
							through: {
								as: 'config',
								attributes: ['color', 'isAdmin']
							}
						}
					]
				},
				{
					model: User,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: User,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName']
				}
			]
		})

		if (invitation)
			return invitation
		else
			throw new NotFoundError('Invitation', null)
	}

	async loadMember(groupId, username) {
		const member = User.findOne({
			attributes: ['username', 'firstName', 'lastName'],
			where: {
				username
			},
			include: [
				{
					model: GroupMembers,
					as: 'config',
					attributes: ['isAdmin', 'color'],
					where: {
						groupId
					}
				}
			]
		})

		if (member) {
			return member
		} else {
			throw new NotFoundError('GroupMember', username)
		}
	}

	/**
	 * Loads a lunchbreak resource into res.locals.lunchbreak.
	 * This middleware requires the request to have the param 'lunchbreakId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadLunchbreak (groupId, date) {
		const lunchbreak = await Lunchbreak.findOne({
			where: {
				groupId: groupId,
				date: date
			},
			include: [
				{
					model:Participant,
					attributes: ['id'],
					include: [
						{
							model: GroupMembers,
							as: 'member',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						},
						{
							model:Vote,
							attributes: ['id', 'points'],
							include: [
								{
									model: Place,
									attributes: ['id', 'name', 'foodType']
								}
							]
						}
					]
				},
				{
					model: Comment,
					attributes: ['id', ['comment', 'text'], 'createdAt', 'updatedAt'],
					include: [
						{
							model: GroupMembers,
							as: 'author',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						}
					]
				}
			],
			order: [
				[Comment, 'createdAt', 'DESC']
			]
		})

		if (lunchbreak)
			return lunchbreak
		else
			throw new NotFoundError('Lunchbreak', null)
	}

	async loadLunchbreaks(groupId, from, to) {
		const lunchbreaks = await Lunchbreak.findAll({
			where: {
				groupId: groupId,
				date: {
					[Op.between]: [from, to]
				}
			},
			include: [
				{
					model:Participant,
					attributes: ['id'],
					include: [
						{
							model: GroupMembers,
							as: 'member',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						},
						{
							model:Vote,
							attributes: ['id', 'points'],
							include: [
								{
									model: Place,
									attributes: ['id', 'name', 'foodType']
								}
							]
						}
					]
				},
				{
					model: Comment,
					attributes: ['id', ['comment', 'text'], 'createdAt', 'updatedAt'],
					include: [
						{
							model: GroupMembers,
							as: 'author',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						}
					]
				}
			],
			order: [
				[Comment, 'createdAt', 'DESC']
			]
		})
		return lunchbreaks
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
				}, GroupMembers, Lunchbreak
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
