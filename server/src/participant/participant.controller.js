const Boom = require('@hapi/boom')
const ParticipationRepository = require('./participant.repository')
const AbsenceModel = require('../absence/absence.model')
const GroupMemberModel = require('../group-member/group-member.model')
const ParticipantModel = require('./participant.model')
const PlaceModel = require('../place/place.model')
const { voteEndingTimeReached, dateIsToday } = require('../util/util')
const LunchbreakController = require('../lunchbreak/lunchbreak.controller')
const VoteController = require('../vote/vote.controller')
const { NotFoundError } = require('objection')

async function deleteParticipation(request, h) {
	const { groupId, date } = request.params
	const userId = request.auth.credentials.id

	const participation = await ParticipationRepository.loadParticipation(groupId, date, userId)

	if (await voteEndingTimeReached(groupId, date)) {
		throw Boom.badRequest('The end of voting has been reached, therefore this participation cannot be deleted')
	}

	await ParticipantModel.query()
		.delete()
		.where({ id: participation.id })

	await LunchbreakController.checkForAutoDeletion(participation.lunchbreak.id)

	return h.response().code(204)
}

async function getParticipationsOfAuthenticatedUser(request, h) {
	const from = new Date(request.query.from)
	const to = new Date(request.query.to)
	const { groupId } = request.params
	const { id } = request.auth.credentials

	if (from >= to) {
		throw Boom.badRequest('The given timespan is invalid')
	}

	if (from.getFullYear() !== to.getFullYear()) {
		throw Boom.badRequest('The query values from and to have to be in the same year')
	}

	return ParticipationRepository.loadParticipations(groupId, from, to, id)
}

async function createParticipation(request, h) {
	const { groupId, date } = request.params
	const { payload } = request
	const userId = request.auth.credentials.id

	if (!dateIsToday(date)) {
		throw Boom.badRequest('Participations can only be created for today')
	}

	const lunchbreak = await LunchbreakController.findOrCreateLunchbreak(groupId, date)

	if (await voteEndingTimeReached(groupId, date)) {
		throw Boom.badRequest('The end of voting has been reached, therefore you cannot create a new participation')
	}

	if (payload.result) {
		const place = await PlaceModel.query()
			.where({ id: payload.result.id, groupId })
			.first()

		// TODO: Foreign key constraint
		if (!place) {
			throw Boom.badRequest('The results placeId does not exists or does not belong to this group')
		}
	}

	const member = await GroupMemberModel.query()
		.select(['id'])
		.where({ groupId, userId })
		.first()

	let participation
	try {
		participation = await ParticipationRepository.loadParticipation(groupId, date, userId)

		await ParticipantModel.query()
			.update({
				resultId: payload.result ? payload.result.id : null,
				amountSpent: payload.amountSpent
			})
			.where({ id: participation.id })

		participation = await ParticipationRepository.loadParticipation(groupId, date, userId)
	} catch (error) {
		if (error instanceof NotFoundError) {
			participation = await ParticipantModel.query()
				.insert({
					lunchbreakId: lunchbreak.id,
					memberId: member.id,
					resultId: payload.result ? payload.result.id : null,
					amountSpent: payload.amountSpent
				})
				.returning('*')
		} else {
			throw error
		}
	}

	await AbsenceModel.query()
		.delete()
		.where({
			memberId: participation.memberId,
			lunchbreakId: participation.lunchbreakId
		})

	payload.votes.forEach(vote => {
		vote.participantId = participation.id
		vote.placeId = vote.place ? vote.place.id : null
	})

	await VoteController.overrideVotes(payload.votes, participation.id)

	return h.response(await ParticipationRepository.loadParticipation(groupId, date, userId)).code(201)
}

async function updateParticipation(request, h) {
	const { groupId, date } = request.params
	const userId = request.auth.credentials.id
	const { payload } = request

	const participation = await ParticipationRepository.loadParticipation(groupId, date, userId)

	await ParticipantModel.query()
		.update({
			amountSpent: payload.amountSpent,
			resultId: payload.result ? payload.result.id : null
		})
		.where({ id: participation.id })

	if (payload.votes && !(await voteEndingTimeReached(groupId, date))) {
		payload.votes.map(vote => {
			vote.participantId = participation.id
			vote.placeId = vote.place ? vote.place.id : null
		})

		await VoteController.overrideVotes(payload.votes, participation.id)
	}

	return ParticipationRepository.loadParticipation(groupId, date, userId)
}

module.exports = {
	getParticipationsOfAuthenticatedUser,

	createParticipation,
	updateParticipation,
	deleteParticipation
}
