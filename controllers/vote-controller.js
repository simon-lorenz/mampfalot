'use strict'

const { Lunchbreak, Participant, Group, Vote } = require('../models')
const { RequestError, ValidationError } = require('../classes/errors')
const { voteEndingTimeReached } = require('../util/util')

async function destroyVotesOfParticipant(participantId) {
	await Vote.destroy({
		where: {
			participantId: participantId
		}
	})
}

class VoteController {

	static async overrideVotes(votes, participantId) {
		if (votes === []) {
			await destroyVotesOfParticipant(participantId)
			return
		}

		const participant = await Participant.findOne({
			where: {
				id: participantId
			},
			include: [
				{
					model: Lunchbreak,
					attributes: ['id'],
					include: [
						{
							model: Group,
							attributes: ['id', 'voteEndingTime', 'utcOffset', 'minPointsPerVote', 'maxPointsPerVote', 'pointsPerDay']
						}
					]
				}
			]
		})

		if (await voteEndingTimeReached(participant.lunchbreak.id)) {
			throw new RequestError('The end of voting has been reached, therefore no new votes will be accepted.')
		}

		const group = participant.lunchbreak.group

		const placeIds = []
		let sum = 0
		for (const vote of votes) {
			const points = parseInt(vote.points)
			if (points > group.maxPointsPerVote) {
				const item = {
					field: 'points',
					value: points,
					message: `Points exceeds maxPointsPerVote (${group.maxPointsPerVote}).`
				}
				throw new ValidationError([item])
			}

			if (points < group.minPointsPerVote) {
				const item = {
					field: 'points',
					value: points,
					message: `Points deceeds minPointsPerVote (${group.minPointsPerVote}).`
				}
				throw new ValidationError([item])
			}

			sum += points
			placeIds.push(vote.placeId)
		}

		if (sum > group.pointsPerDay) {
			const item = {
				field: 'points',
				value: sum,
				message: `Sum of points exceeds pointsPerDay (${group.pointsPerDay}).`
			}
			throw new ValidationError([item])
		}

		for (let i = 0; i < placeIds.length; i++) {
			if (i !== placeIds.indexOf(placeIds[i])) {
				const item = {
					field: 'placeId',
					value: placeIds[i],
					message: 'Votes must have different places.'
				}
				throw new ValidationError([item])
			}
		}

		await destroyVotesOfParticipant(participantId)

		await Vote.bulkCreate(votes, { validate: true })
	}

}

module.exports = VoteController
