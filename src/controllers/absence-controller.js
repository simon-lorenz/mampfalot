const { Absence, Comment, Lunchbreak, GroupMembers, Participant } = require('../models')
const { RequestError, NotFoundError, AuthorizationError } = require('../util/errors')
const { dateIsToday, voteEndingTimeReached } = require('../util/util')

class AbsenceController {
	constructor(user) {
		this.user = user
	}

	async createAbsence(lunchbreakController, groupId, date) {
		if (!dateIsToday(date)) {
			throw new RequestError('Absences can only be created for today.')
		}

		let lunchbreak = await Lunchbreak.findOne({
			attributes: ['id'],
			where: {
				groupId,
				date
			}
		})

		if (lunchbreak === null) {
			if (dateIsToday(date) === false) {
				throw new RequestError('The end of voting is reached, therefore you cannot create a new lunchbreak.')
			} else {
				lunchbreak = await lunchbreakController.createLunchbreak(groupId)
				if (await voteEndingTimeReached(lunchbreak.id)) {
					await Lunchbreak.destroy({
						where: {
							id: lunchbreak.id
						}
					})
					throw new RequestError('The end of voting is reached, therefore you cannot create a new lunchbreak.')
				}
			}
		} else {
			if (await voteEndingTimeReached(lunchbreak.id)) {
				throw new RequestError('The end of voting has been reached, therefore you cannot mark yourself as absent.')
			}
		}

		const member = await GroupMembers.findOne({
			attributes: ['id'],
			where: {
				groupId,
				userId: this.user.id
			}
		})

		if (member === null) {
			throw new AuthorizationError('Absence', null, 'CREATE')
		}

		let absence = await Absence.findOne({
			where: {
				lunchbreakId: lunchbreak.id,
				memberId: member.id
			}
		})

		if (absence === null) {
			absence = await Absence.build({
				lunchbreakId: lunchbreak.id,
				memberId: member.id
			})
			await this.user.can.createAbsence(absence)
			await absence.save()
			await Participant.destroy({
				where: {
					memberId: absence.memberId,
					lunchbreakId: absence.lunchbreakId
				}
			})
		}
	}

	async deleteAbsence(lunchbreakController, groupId, date) {
		if (!dateIsToday(date)) {
			throw new RequestError('You can only delete todays absence.')
		}

		let lunchbreak = await Lunchbreak.findOne({
			attributes: ['id'],
			where: {
				groupId,
				date
			}
		})

		if (lunchbreak === null) {
			throw new NotFoundError('Lunchbreak')
		} else if (await voteEndingTimeReached(lunchbreak.id)) {
			throw new RequestError('The end of voting is reached, therefore you cannot delete this absence.')
		}

		const member = await GroupMembers.findOne({
			attributes: ['id'],
			where: {
				groupId,
				userId: this.user.id
			}
		})

		if (member === null) {
			throw new AuthorizationError('Absence', null, 'DELETE')
		}

		const absence = await Absence.findOne({
			where: {
				lunchbreakId: lunchbreak.id,
				memberId: member.id
			}
		})

		await this.user.can.deleteAbsence(absence)

		await absence.destroy()

		lunchbreak = await Lunchbreak.findOne({
			attributes: ['id'],
			where: {
				groupId,
				date
			},
			include: [Comment, Participant, Absence]
		})

		if (lunchbreak.comments.length === 0 && lunchbreak.participants.length === 0 && lunchbreak.absences.length === 0) {
			await lunchbreak.destroy()
		}
	}
}

module.exports = AbsenceController
