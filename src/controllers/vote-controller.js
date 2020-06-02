const Boom = require('@hapi/boom')
const { GroupRepository } = require('../repositories')
const { Vote } = require('../models')

/**
 * Overrides the votes of a participation, if the provided votes are valid.
 * This function does not check the voteEndingTime!
 */
async function overrideVotes(votes, participantId) {
	if (votes === []) {
		return await destroyVotesOfParticipant(participantId)
	}

	const config = await GroupRepository.getGroupConfigByParticipant(participantId)

	checkMinPointsPerVote(votes, config.minPointsPerVote)
	checkMaxPointsPerVote(votes, config.maxPointsPerVote)
	checkPointsPerDay(votes, config.pointsPerDay)
	checkPlaces(votes, config.places)

	await destroyVotesOfParticipant(participantId)
	await Vote.bulkCreate(votes)
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

/**
 * Checks if all points are equal or greater than minPointsPerVote
 * @param {array} votes
 * @param {number} maxPointsPerVote
 * @throws {Boom.badRequest}
 */
function checkMinPointsPerVote(votes, minPointsPerVote) {
	const invalidVotes = votes.filter(vote => Number(vote.points) < minPointsPerVote)

	if (invalidVotes.length > 0) {
		throw Boom.badRequest(`Points is less than minPointsPerVote (${minPointsPerVote})`)
	}
}

/**
 * Checks if all points are equal or less than maxPointsPerVote
 * @param {array} votes
 * @param {number} maxPointsPerVote
 * @throws {Boom.badRequest}
 */
function checkMaxPointsPerVote(votes, maxPointsPerVote) {
	const invalidVotes = votes.filter(vote => Number(vote.points) > maxPointsPerVote)

	if (invalidVotes.length > 0) {
		throw Boom.badRequest(`Points is greater than maxPointsPerVote (${maxPointsPerVote})`)
	}
}

/**
 * Checks if the sum of points is equal or less than pointsPerDay.
 * @throws {Boom.badRequest}
 */
function checkPointsPerDay(votes, pointsPerDay) {
	const sum = votes.reduce((acc, vote) => {
		return acc + vote.points
	}, 0)

	if (sum > pointsPerDay) {
		throw Boom.badRequest(`Sum of points exceeds pointsPerDay (${pointsPerDay})`)
	}
}

/**
 * Checks for places that are not associated with the group
 * @throws {Boom.badRequest}
 */
function checkPlaces(votes, places) {
	for (const vote of votes) {
		if (places.find(place => place.id === vote.place.id) === undefined) {
			throw Boom.badRequest('At least one vote contains a place that is not associated with the group')
		}
	}
}

module.exports = {
	overrideVotes
}
