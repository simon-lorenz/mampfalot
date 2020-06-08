const Boom = require('@hapi/boom')
const ParticipationRepository = require('./participant.repository')
const AbsenceModel = require('../absence/absence.model')
const GroupMemberModel = require('../group-member/group-member.model')
const ParticipantModel = require('./participant.model')
const PlaceModel = require('../place/place.model')
const { voteEndingTimeReached, dateIsToday } = require('../util/util')
const LunchbreakController = require('../lunchbreak/lunchbreak.controller')
const VoteController = require('../vote/vote.controller')

async function deleteParticipation(request, h) {
	const { groupId, date } = request.params
	const userId = request.auth.credentials.id

	const participation = await ParticipationRepository.loadParticipation(groupId, date, userId)

	if (await voteEndingTimeReached(groupId, date)) {
		throw Boom.badRequest('The end of voting has been reached, therefore this participation cannot be deleted')
	}

	await participation.destroy()

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

	const participations = await ParticipationRepository.loadParticipations(groupId, from, to, id)
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
		const place = await PlaceModel.findOne({ where: { id: payload.result.id, groupId } })

		if (!place) {
			throw Boom.badRequest('The results placeId does not exists or does not belong to this group')
		}
	}

	const member = await GroupMemberModel.findOne({
		attributes: ['id'],
		where: {
			groupId,
			userId
		}
	})

	let participation
	try {
		participation = await ParticipationRepository.loadParticipation(groupId, date, userId)
		participation.resultId = payload.result ? payload.result.id : null
		participation.amountSpent = payload.amountSpent
	} catch (error) {
		if (Boom.isBoom(error) && error.output.statusCode === 404) {
			participation = ParticipantModel.build({
				lunchbreakId: lunchbreak.id,
				memberId: member.id,
				resultId: payload.result ? payload.result.id : null,
				amountSpent: payload.amountSpent
			})
		} else {
			throw error
		}
	}

	await participation.save()

	await AbsenceModel.destroy({
		where: {
			memberId: participation.memberId,
			lunchbreakId: participation.lunchbreakId
		}
	})

	payload.votes.forEach(vote => {
		vote.participantId = participation.id
		vote.placeId = vote.place ? vote.place.id : null
	})

	await VoteController.overrideVotes(payload.votes, participation.id)

	const result = await ParticipationRepository.loadParticipation(groupId, date, userId)
	return h
		.response({
			date: result.lunchbreak.date,
			votes: result.votes.map(vote => {
				vote = vote.toJSON()
				delete vote.id
				return vote
			}),
			result: result.result,
			amountSpent: result.amountSpent
		})
		.code(201)
}

async function updateParticipation(request, h) {
	const { groupId, date } = request.params
	const userId = request.auth.credentials.id
	const { payload } = request

	const participation = await ParticipationRepository.loadParticipation(groupId, date, userId)

	participation.amountSpent = payload.amountSpent
	participation.resultId = payload.result ? payload.result.id : null

	await participation.save()

	if (payload.votes && !(await voteEndingTimeReached(groupId, date))) {
		payload.votes.map(vote => {
			vote.participantId = participation.id
			vote.placeId = vote.place ? vote.place.id : null
		})

		await VoteController.overrideVotes(payload.votes, participation.id)
	}

	const result = await ParticipationRepository.loadParticipation(groupId, date, userId)

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

module.exports = {
	getParticipationsOfAuthenticatedUser,

	createParticipation,
	updateParticipation,
	deleteParticipation
}
