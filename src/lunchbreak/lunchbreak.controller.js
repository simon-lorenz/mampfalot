const Boom = require('@hapi/boom')
const { voteEndingTimeReached } = require('../util/util')

const LunchbreakRepository = require('../lunchbreak/lunchbreak.repository')
const AbsenceModel = require('../absence/absence.model')
const CommentModel = require('../comment/comment.model')
const LunchbreakModel = require('./lunchbreak.model')
const ParticipantModel = require('../participant/participant.model')

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
		if (Boom.isBoom(e, 404) === false) {
			throw e
		}

		if (await voteEndingTimeReached(groupId, date)) {
			throw Boom.badRequest('The end of voting is reached, therefore you cannot create a new lunchbreak.')
		}

		const lunchbreak = await LunchbreakModel.build({ groupId, date })

		await lunchbreak.save()
		return await LunchbreakRepository.getLunchbreak(groupId, date)
	}
}

/**
 * Deletes a lunchbreak if it has no participants, comments and absences
 * @param {number} lunchbreakId
 */
async function checkForAutoDeletion(lunchbreakId) {
	const lunchbreak = await LunchbreakModel.findByPk(lunchbreakId, {
		include: [ParticipantModel, CommentModel, AbsenceModel]
	})

	if (lunchbreak.participants.length === 0 && lunchbreak.comments.length === 0 && lunchbreak.absences.length === 0) {
		await lunchbreak.destroy()
	}
}

module.exports = {
	getLunchbreak,
	getLunchbreaks,
	findOrCreateLunchbreak,
	checkForAutoDeletion
}
