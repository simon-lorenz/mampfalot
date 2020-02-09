const ResourceLoader = require('../classes/resource-loader')
const { Lunchbreak } = require('../models')
const { RequestError } = require('../classes/errors')

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

		let lunchbreaks = await ResourceLoader.loadLunchbreaks(groupId, from, to)
		lunchbreaks = await Promise.all(
			lunchbreaks.map(async lunchbreak => {
				const group = await ResourceLoader.loadGroupById(groupId)
				lunchbreak = lunchbreak.toJSON()

				delete lunchbreak.groupId
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
					const participates = lunchbreak.participants.find(p => p.member.username === member.username)
					const absent = lunchbreak.absent.find(absent => absent.username === member.username)
					return !participates && !absent
				})

				return lunchbreak
			})
		)
		return lunchbreaks
	}

	async getLunchbreak(groupId, date) {
		const group = await ResourceLoader.loadGroupById(groupId)
		let lunchbreak = await ResourceLoader.loadLunchbreak(groupId, date)
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

		await this.user.can.readLunchbreak(lunchbreak)

		delete lunchbreak.groupId

		return lunchbreak
	}

	async createLunchbreak(groupId) {
		const today = new Date().toISOString().substring(0, 10)
		const lunchbreak = await Lunchbreak.build({ groupId, date: today })
		await this.user.can.createLunchbreak(lunchbreak)
		await lunchbreak.save()
		return await this.getLunchbreak(groupId, today)
	}
}

module.exports = LunchbreakController
