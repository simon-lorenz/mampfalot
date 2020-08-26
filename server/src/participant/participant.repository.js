const ParticipantModel = require('./participant.model')

class ParticipationRepository {
	async loadParticipation(groupId, date, userId) {
		return ParticipantModel.query()
			.throwIfNotFound()
			.withGraphJoined('[member.user, lunchbreak, votes.place, result]')
			.where('member.userId', '=', userId)
			.where('lunchbreak.date', '=', date)
			.where('lunchbreak.groupId', '=', groupId)
			.first()
	}

	async loadParticipations(groupId, from, to, userId) {
		return ParticipantModel.query()
			.select(['amountSpent'])
			.withGraphJoined('[member.user, lunchbreak, votes.place, result]')
			.where('member.userId', '=', userId)
			.where('lunchbreak.groupId', '=', groupId)
			.whereBetween('lunchbreak.date', [from, to])
	}
}
module.exports = new ParticipationRepository()
