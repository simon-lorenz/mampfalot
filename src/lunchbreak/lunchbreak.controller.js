const Boom = require('@hapi/boom')
const { NotFoundError } = require('objection')

const LunchbreakRepository = require('../lunchbreak/lunchbreak.repository')
const LunchbreakModel = require('./lunchbreak.model')
const { voteEndingTimeReached } = require('../util/util')

async function getLunchbreaks(request, h) {
	const from = new Date(request.query.from)
	const to = new Date(request.query.to)
	const { groupId } = request.params

	if (from >= to) {
		throw Boom.badRequest('The given timespan is invalid.')
	}

	if (from.getFullYear() !== to.getFullYear()) {
		throw Boom.badRequest('The query values from and to have to be in the same year.')
	}

	return LunchbreakRepository.getLunchbreaks(groupId, from, to)
}

async function getLunchbreak(request, h) {
	const { groupId, date } = request.params
	return LunchbreakRepository.getLunchbreak(groupId, date)
}

async function findOrCreateLunchbreak(groupId, date) {
	try {
		return await LunchbreakRepository.getLunchbreak(groupId, date)
	} catch (e) {
		if (!(e instanceof NotFoundError)) {
			throw e
		}

		if (await voteEndingTimeReached(groupId, date)) {
			throw Boom.badRequest('The end of voting is reached, therefore you cannot create a new lunchbreak.')
		}

		await LunchbreakModel.query().insert({ groupId, date })

		return await LunchbreakRepository.getLunchbreak(groupId, date)
	}
}

/**
 * Deletes a lunchbreak if it has no participants, comments and absences
 * @param {number} lunchbreakId
 */
async function checkForAutoDeletion(lunchbreakId) {
	const lunchbreak = await LunchbreakRepository.getLunchbreak(undefined, undefined, lunchbreakId)

	if (lunchbreak.participants.length === 0 && lunchbreak.comments.length === 0 && lunchbreak.absent.length === 0) {
		await LunchbreakModel.query()
			.delete()
			.where({ id: lunchbreakId })
	}
}

module.exports = {
	getLunchbreak,
	getLunchbreaks,
	findOrCreateLunchbreak,
	checkForAutoDeletion
}
