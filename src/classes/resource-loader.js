const { Absence, Comment, Group, Place, Lunchbreak, User, GroupMembers, Participant, Vote } = require('../models')
const { NotFoundError } = require('../util/errors')
const Op = require('sequelize').Op

class ResourceLoader {
	async getUserIdByUsername(username) {
		const user = await User.findOne({
			attributes: ['id'],
			where: {
				username
			}
		})

		if (user) {
			return user.id
		} else {
			throw new NotFoundError('User', username)
		}
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
				}
			]
		})

		if (group) {
			return group
		} else {
			throw new NotFoundError('Group', id)
		}
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
	async loadLunchbreak(groupId, date) {
		const lunchbreak = await Lunchbreak.findOne({
			where: {
				groupId: groupId,
				date: date
			},
			include: [
				{
					model: Participant,
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
							model: Vote,
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
					model: Absence,
					attributes: ['memberId'],
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
						}
					]
				},
				{
					model: Comment,
					attributes: ['id', 'text', 'createdAt', 'updatedAt'],
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
			order: [[Comment, 'createdAt', 'DESC']]
		})

		if (lunchbreak) {
			return lunchbreak
		} else {
			throw new NotFoundError('Lunchbreak', null)
		}
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
					model: Participant,
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
							model: Vote,
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
					model: Absence,
					attributes: ['memberId'],
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
						}
					]
				},
				{
					model: Comment,
					attributes: ['id', 'text', 'createdAt', 'updatedAt'],
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
			order: [[Comment, 'createdAt', 'DESC']]
		})
		return lunchbreaks
	}

	/**
	 * Loads a user resource into res.locals.resources.user.
	 * This middleware requires the request to have the param 'userId'.
	 * If the resource can not be found, a NotFoundError is passed to next()
	 */
	async loadUser(req, res, next) {
		const userId = parseInt(req.params.userId)
		res.locals.resources = {}
		res.locals.resources.user = await User.unscoped().findByPk(userId)

		if (res.locals.resources.user) {
			return next()
		} else {
			return next(new NotFoundError('User', userId))
		}
	}
}

module.exports = new ResourceLoader()
