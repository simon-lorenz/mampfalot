const { Lunchbreak, Participant, Group, Vote } = require('../models')
const { ValidationError } = require('../util/errors')

class VoteController {
	/**
	 * Overrides the votes of a participation, if the provided votes are valid.
	 * This function does not check the voteEndingTime!
	 */
	static async overrideVotes(votes, participantId) {
		if (votes === []) {
			return await destroyVotesOfParticipant(participantId)
		}

		const config = await getGroupConfig(participantId)
		checkMinPointsPerVote(votes, config.minPointsPerVote)
		checkMaxPointsPerVote(votes, config.maxPointsPerVote)
		checkPointsPerDay(votes, config.pointsPerDay)
		checkPlaces(votes)

		await destroyVotesOfParticipant(participantId)
		await Vote.bulkCreate(votes, { validate: true })
	}
}

/**
 * @param {number} participantId
 */
async function destroyVotesOfParticipant(participantId) {
	await Vote.destroy({
		where: {
			participantId: participantId
		}
	})
}

async function getGroupConfig(participantId) {
	const participant = await Participant.findByPk(participantId, {
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

	return participant.lunchbreak.group
}

/**
 * Checks if all points are equal or greater than minPointsPerVote
 * @param {array} votes
 * @param {number} maxPointsPerVote
 * @throws {ValidationError}
 */
function checkMinPointsPerVote(votes, minPointsPerVote) {
	const invalidVotes = votes.filter(vote => Number(vote.points) < minPointsPerVote)

	if (invalidVotes.length > 0) {
		throw new ValidationError(
			invalidVotes.map(vote => {
				return {
					field: 'points',
					value: vote.points,
					message: `Points deceeds minPointsPerVote (${minPointsPerVote}).`
				}
			})
		)
	}
}

/**
 * Checks if all points are equal or less than maxPointsPerVote
 * @param {array} votes
 * @param {number} maxPointsPerVote
 * @throws {ValidationError}
 */
function checkMaxPointsPerVote(votes, maxPointsPerVote) {
	const invalidVotes = votes.filter(vote => Number(vote.points) > maxPointsPerVote)

	if (invalidVotes.length > 0) {
		throw new ValidationError(
			invalidVotes.map(vote => {
				return {
					field: 'points',
					value: vote.points,
					message: `Points exceeds maxPointsPerVote (${maxPointsPerVote}).`
				}
			})
		)
	}
}

/**
 * Checks if the sum of points is equal or less than pointsPerDay.
 * @throws {ValidationError}
 */
function checkPointsPerDay(votes, pointsPerDay) {
	const sum = votes.reduce((acc, vote) => {
		return acc + vote.points
	}, 0)

	if (sum > pointsPerDay) {
		throw new ValidationError([
			{
				field: 'points',
				value: sum,
				message: `Sum of points exceeds pointsPerDay (${pointsPerDay}).`
			}
		])
	}
}

/**
 * Checks for duplicate placeIds.
 * @throws {ValidationError}
 */
function checkPlaces(votes) {
	const placeIds = votes.map(vote => vote.placeId)

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
}

module.exports = VoteController
