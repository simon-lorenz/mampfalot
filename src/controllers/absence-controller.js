const { Absence, Participant } = require('../models')
const { RequestError, AuthorizationError } = require('../util/errors')
const { dateIsToday, voteEndingTimeReached } = require('../util/util')
const { AbsenceRepository, GroupMemberRepository, LunchbreakRepository } = require('../repositories')

class AbsenceController {
	constructor(user) {
		this.user = user
	}

	async createAbsence(lunchbreakController, groupId, date) {
		if (!this.user.isGroupMember(groupId)) {
			throw new AuthorizationError('Absence', null, 'CREATE')
		}

		if (!dateIsToday(date)) {
			throw new RequestError('Absences can only be created for today.')
		}

		if (await voteEndingTimeReached(groupId, date)) {
			throw new RequestError('The end of voting has been reached, therefore you cannot mark yourself as absent.')
		}

		try {
			const lunchbreak = await lunchbreakController.findOrCreateLunchbreak(groupId, date)
			const member = await GroupMemberRepository.getMember(groupId, this.user.username)
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
		} catch (error) {
			if (error instanceof AuthorizationError) {
				throw new AuthorizationError('Absence', null, 'CREATE')
			} else {
				throw error
			}
		}
	}

	async deleteAbsence(lunchbreakController, groupId, date) {
		if (!this.user.isGroupMember(groupId)) {
			throw new AuthorizationError('Absence', null, 'DELETE')
		}

		if (!dateIsToday(date)) {
			throw new RequestError('You can only delete todays absence.')
		}

		if (await voteEndingTimeReached(groupId, date)) {
			throw new RequestError('The end of voting is reached, therefore you cannot delete this absence.')
		}

		const lunchbreakId = await LunchbreakRepository.getLunchbreakId(groupId, date)
		const member = await GroupMemberRepository.getMember(groupId, this.user.username)

		await Absence.destroy({
			where: {
				lunchbreakId: lunchbreakId,
				memberId: member.id
			}
		})

		await lunchbreakController.checkForAutoDeletion(lunchbreakId)
	}
}

module.exports = AbsenceController
