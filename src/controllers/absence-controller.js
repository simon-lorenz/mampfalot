const Boom = require('@hapi/boom')
const { Absence, Participant } = require('../models')
const { dateIsToday, voteEndingTimeReached } = require('../util/util')
const { AbsenceRepository, GroupMemberRepository, LunchbreakRepository } = require('../repositories')
const LunchbreakController = require('./lunchbreak-controller')

async function createAbsence(request, h) {
	const { groupId, date } = request.params

	if (!dateIsToday(date)) {
		throw Boom.badRequest('Absences can only be created for today.')
	}

	if (await voteEndingTimeReached(groupId, date)) {
		throw Boom.badRequest('The end of voting has been reached, therefore you cannot mark yourself as absent.')
	}

	const lunchbreak = await LunchbreakController.findOrCreateLunchbreak(groupId, date)
	const member = await GroupMemberRepository.getMember(groupId, request.auth.credentials.username)
	const absence = await AbsenceRepository.getAbsence(lunchbreak.id, member.id)

	if (absence === null) {
		await Absence.create({
			lunchbreakId: lunchbreak.id,
			memberId: member.id
		})

		await Participant.destroy({
			where: {
				lunchbreakId: lunchbreak.id,
				memberId: member.id
			}
		})
	}

	return h.response().code(201)
}

async function deleteAbsence(request, h) {
	const { groupId, date } = request.params

	if (!dateIsToday(date)) {
		throw Boom.badRequest('You can only delete todays absence.')
	}

	if (await voteEndingTimeReached(groupId, date)) {
		throw Boom.badRequest('The end of voting is reached, therefore you cannot delete this absence.')
	}

	const lunchbreakId = await LunchbreakRepository.getLunchbreakId(groupId, date)
	const member = await GroupMemberRepository.getMember(groupId, request.auth.credentials.username)

	await Absence.destroy({
		where: {
			lunchbreakId: lunchbreakId,
			memberId: member.id
		}
	})

	await LunchbreakController.checkForAutoDeletion(lunchbreakId)

	return h.response().code(204)
}

module.exports = {
	createAbsence,
	deleteAbsence
}
