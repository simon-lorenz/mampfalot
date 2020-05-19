const { GroupRepository, LunchbreakRepository } = require('../repositories')
const { Lunchbreak, Participant, Comment, Absence } = require('../models')
const { NotFoundError, RequestError, AuthorizationError } = require('../util/errors')
const { voteEndingTimeReached } = require('../util/util')

class LunchbreakController {
	constructor(user) {
		this.user = user
	}

	convertComment(comment) {
		function getAuthor(comment) {
			if (comment.author === null) {
				return null
			}

			return {
				username: comment.author.user.username,
				firstName: comment.author.user.firstName,
				lastName: comment.author.user.lastName,
				config: {
					color: comment.author.color,
					isAdmin: comment.author.isAdmin
				}
			}
		}

		return {
			id: comment.id,
			text: comment.text,
			createdAt: comment.createdAt,
			updatedAt: comment.updatedAt,
			author: getAuthor(comment)
		}
	}

	convertParticipant(participant) {
		function getMember(participant) {
			if (participant.member === null) {
				return null
			}

			return {
				username: participant.member.user.username,
				firstName: participant.member.user.firstName,
				lastName: participant.member.user.lastName,
				config: {
					color: participant.member.color,
					isAdmin: participant.member.isAdmin
				}
			}
		}

		return {
			member: getMember(participant),
			votes: participant.votes.map(vote => {
				delete vote.id
				return vote
			})
		}
	}

	async getLunchbreaks(groupId, from, to) {
		from = new Date(from)
		to = new Date(to)

		if (from >= to) {
			throw new RequestError('The given timespan is invalid.')
		}

		if (from.getFullYear() !== to.getFullYear()) {
			throw new RequestError('The query values from and to have to be in the same year.')
		}

		let lunchbreaks = await LunchbreakRepository.getLunchbreaks(groupId, from, to)
		const group = await GroupRepository.getGroup(groupId)

		lunchbreaks = lunchbreaks.map(lunchbreak => {
			lunchbreak.participants = lunchbreak.participants.map(this.convertParticipant)
			lunchbreak.absent = lunchbreak.absences.map(absence => {
				return {
					username: absence.member.user.username,
					firstName: absence.member.user.firstName,
					lastName: absence.member.user.lastName,
					config: {
						color: absence.member.color,
						isAdmin: absence.member.isAdmin
					}
				}
			})

			delete lunchbreak.absences
			delete lunchbreak.groupId

			const allMembers = group.members
			lunchbreak.responseless = allMembers.filter(member => {
				const participates = lunchbreak.participants.find(p => p.member.username === member.username)
				const absent = lunchbreak.absent.find(absent => absent.username === member.username)
				return !participates && !absent
			})

			return lunchbreak
		})

		return lunchbreaks
	}

	async getLunchbreak(groupId, date) {
		const group = await GroupRepository.getGroup(groupId)
		let lunchbreak = await LunchbreakRepository.getLunchbreak(groupId, date)
		lunchbreak = lunchbreak.toJSON()

		// Restructuring Comment properties
		lunchbreak.comments = lunchbreak.comments.map(comment => this.convertComment(comment))
		lunchbreak.participants = lunchbreak.participants.map(participant => this.convertParticipant(participant))
		lunchbreak.absent = lunchbreak.absences.map(absence => {
			return {
				username: absence.member.user.username,
				firstName: absence.member.user.firstName,
				lastName: absence.member.user.lastName,
				config: {
					color: absence.member.color,
					isAdmin: absence.member.isAdmin
				}
			}
		})
		delete lunchbreak.absences

		const allMembers = group.members
		lunchbreak.responseless = allMembers.filter(member => {
			const participates = lunchbreak.participants.find(p => p.member !== null && p.member.username === member.username)
			const absent = lunchbreak.absent.find(absent => absent.username === member.username)
			return !participates && !absent
		})

		if (!this.user.isGroupMember(groupId)) {
			throw new AuthorizationError('Lunchbreak', lunchbreak.id, 'READ')
		}

		delete lunchbreak.groupId

		return lunchbreak
	}

	async findOrCreateLunchbreak(groupId, date) {
		try {
			return await this.getLunchbreak(groupId, date)
		} catch (err) {
			if (err instanceof NotFoundError === false) {
				throw err
			}

			if (await voteEndingTimeReached(groupId, date)) {
				throw new RequestError('The end of voting is reached, therefore you cannot create a new lunchbreak.')
			}

			const lunchbreak = await Lunchbreak.build({ groupId, date })

			if (!this.user.isGroupMember(groupId)) {
				throw new AuthorizationError('Lunchbreak', null, 'CREATE')
			}

			await lunchbreak.save()
			return this.getLunchbreak(groupId, date)
		}
	}

	/**
	 * Deletes a lunchbreak if it has no participants, comments and absences
	 * @param {number} lunchbreakId
	 */
	async checkForAutoDeletion(lunchbreakId) {
		const lunchbreak = await Lunchbreak.findByPk(lunchbreakId, {
			include: [Participant, Comment, Absence]
		})

		if (lunchbreak.participants.length === 0 && lunchbreak.comments.length === 0 && lunchbreak.absences.length === 0) {
			await lunchbreak.destroy()
		}
	}
}

module.exports = LunchbreakController
