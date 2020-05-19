const { Lunchbreak, Participant, GroupMembers, User, Vote, Place, Absence, Comment } = require('../models')
const { NotFoundError } = require('../util/errors')
const { Op } = require('sequelize')

class LunchbreakRepository {
	async getLunchbreak(groupId, date) {
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

	async getLunchbreakId(groupId, date) {
		const lunchbreak = await Lunchbreak.findOne({
			attributes: ['id'],
			where: {
				groupId,
				date
			}
		})

		if (lunchbreak) {
			return lunchbreak.id
		} else {
			throw new NotFoundError('Lunchbreak', null)
		}
	}

	async getLunchbreaks(groupId, from, to) {
		let lunchbreaks = await Lunchbreak.findAll(
			{
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
			},
			{ raw: true }
		)

		lunchbreaks = lunchbreaks.map(lunchbreak => lunchbreak.toJSON())

		return lunchbreaks.map(lunchbreak => {
			lunchbreak.comments = lunchbreak.comments.map(comment => {
				return {
					id: comment.id,
					text: comment.text,
					createdAt: comment.createdAt,
					updatedAt: comment.updatedAt,
					author: {
						firstName: comment.author.user.firstName,
						lastName: comment.author.user.lastName,
						username: comment.author.user.username,
						config: {
							color: comment.author.color,
							isAdmin: comment.author.isAdmin
						}
					}
				}
			})
			return lunchbreak
		})
	}
}

module.exports = new LunchbreakRepository()
