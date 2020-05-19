const { Absence, Participant, GroupMembers, Lunchbreak, Vote, Place, Comment } = require('../models')
const { NotFoundError, RequestError, AuthorizationError } = require('../util/errors')
const { Op } = require('sequelize')
const { voteEndingTimeReached, dateIsToday } = require('../util/util')
const VoteController = require('./vote-controller')

class ParticipationLoader {
	static async loadParticipation(groupId, date, userId) {
		const participation = await Participant.findOne({
			include: [
				{
					model: GroupMembers,
					attributes: [],
					as: 'member',
					where: {
						userId: userId
					}
				},
				{
					model: Lunchbreak,
					attributes: ['id', 'date'],
					where: {
						date: date,
						groupId: groupId
					}
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
				},
				{
					model: Place,
					as: 'result',
					attributes: ['id', 'name', 'foodType']
				}
			]
		})

		if (participation) {
			return participation
		} else {
			throw new NotFoundError('Participation')
		}
	}

	static async loadParticipations(groupId, from, to, userId) {
		return await Participant.findAll({
			attributes: ['amountSpent'],
			include: [
				{
					model: GroupMembers,
					attributes: [],
					as: 'member',
					where: {
						userId: userId
					}
				},
				{
					model: Lunchbreak,
					attributes: ['date'],
					where: {
						date: {
							[Op.between]: [from, to]
						},
						groupId: groupId
					}
				},
				{
					model: Place,
					as: 'result',
					attributes: ['id', 'name', 'foodType']
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
		})
	}
}

class ParticipationController {
	constructor(user) {
		this.user = user
	}

	async deleteParticipation(groupId, date) {
		const participation = await ParticipationLoader.loadParticipation(groupId, date, this.user.id)

		if (await voteEndingTimeReached(groupId, date)) {
			throw new RequestError('The end of voting has been reached, therefore this participation cannot be deleted.')
		}

		await participation.destroy()

		const lunchbreak = await Lunchbreak.findByPk(participation.lunchbreak.id, {
			include: [Participant, Comment, Absence]
		})

		if (lunchbreak.participants.length === 0 && lunchbreak.comments.length === 0 && lunchbreak.absences.length === 0) {
			await lunchbreak.destroy()
		}
	}

	async getParticipations(groupId, from, to) {
		from = new Date(from)
		to = new Date(to)

		if (from >= to) {
			throw new RequestError('The given timespan is invalid.')
		}

		if (from.getFullYear() !== to.getFullYear()) {
			throw new RequestError('The query values from and to have to be in the same year.')
		}

		const participations = await ParticipationLoader.loadParticipations(groupId, from, to, this.user.id)
		return participations.map(participation => {
			participation = participation.toJSON()
			return {
				date: participation.lunchbreak.date,
				result: participation.result,
				amountSpent: participation.amountSpent,
				votes: participation.votes.map(vote => {
					delete vote.id
					return vote
				})
			}
		})
	}

	async createParticipation(groupId, date, values, lunchbreakController) {
		if (!dateIsToday(date)) {
			throw new RequestError('Participations can only be created for today.')
		}

		let lunchbreak
		try {
			lunchbreak = await lunchbreakController.findOrCreateLunchbreak(groupId, date)
		} catch (error) {
			if (error instanceof AuthorizationError) {
				throw new AuthorizationError('Participation', null, 'CREATE')
			} else {
				throw error
			}
		}

		if (await voteEndingTimeReached(groupId, date)) {
			throw new RequestError('The end of voting has been reached, therefore you cannot create a new participation.')
		}

		const member = await GroupMembers.findOne({
			attributes: ['id'],
			where: {
				groupId,
				userId: this.user.id
			}
		})

		let participation

		try {
			participation = await ParticipationLoader.loadParticipation(groupId, date, this.user.id)
			participation.resultId = values.result ? values.result.id : null
			participation.amountSpent = values.amountSpent
		} catch (error) {
			if (error instanceof NotFoundError) {
				participation = Participant.build({
					lunchbreakId: lunchbreak.id,
					memberId: member.id,
					resultId: values.result ? values.result.id : null,
					amountSpent: values.amountSpent
				})
			} else {
				throw error
			}
		}

		await participation.save()

		await Absence.destroy({
			where: {
				memberId: participation.memberId,
				lunchbreakId: participation.lunchbreakId
			}
		})

		values.votes.map(vote => {
			vote.participantId = participation.id
			vote.placeId = vote.place ? vote.place.id : null
		})

		await VoteController.overrideVotes(values.votes, participation.id)

		const result = await ParticipationLoader.loadParticipation(groupId, date, this.user.id)
		return {
			date: result.lunchbreak.date,
			votes: result.votes.map(vote => {
				vote = vote.toJSON()
				delete vote.id
				return vote
			}),
			result: result.result,
			amountSpent: result.amountSpent
		}
	}

	async updateParticipation(groupId, date, values) {
		const participation = await ParticipationLoader.loadParticipation(groupId, date, this.user.id)
		if (participation === null) {
			throw new NotFoundError('Participation', null)
		}

		participation.amountSpent = values.amountSpent
		participation.resultId = values.result ? values.result.id : null

		await participation.save()

		if (values.votes && !(await voteEndingTimeReached(groupId, date))) {
			values.votes.map(vote => {
				vote.participantId = participation.id
				vote.placeId = vote.place ? vote.place.id : null
			})

			await VoteController.overrideVotes(values.votes, participation.id)
		}

		const result = await ParticipationLoader.loadParticipation(groupId, date, this.user.id)
		return {
			date: result.lunchbreak.date,
			votes: result.votes.map(vote => {
				vote = vote.toJSON()
				delete vote.id
				return vote
			}),
			result: result.result,
			amountSpent: result.amountSpent
		}
	}
}

module.exports = ParticipationController
