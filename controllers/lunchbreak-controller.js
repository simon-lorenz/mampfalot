'use strict'

const ResourceLoader = require('../classes/resource-loader')
const user = require('../classes/user')
const { Lunchbreak } = require('../models')
const { RequestError } = require('../classes/errors')

class LunchbreakController {

	convertComment(comment) {
		return {
			id: comment.id,
			text: comment.text,
			createdAt: comment.createdAt,
			updatedAt: comment.updatedAt,
			author: {
				username: comment.author.user.username,
				firstName: comment.author.user.firstName,
				lastName: comment.author.user.lastName,
				config: {
					color: comment.author.color,
					isAdmin: comment.author.isAdmin
				}
			}
		}
	}

	convertParticipant(participant) {
		return {
			member: {
				username: participant.member.user.username,
				firstName: participant.member.user.firstName,
				lastName: participant.member.user.lastName,
				config: {
					color: participant.member.color,
					isAdmin: participant.member.isAdmin
				}
			},
			votes: participant.votes
		}
	}

	async getLunchbreaks(groupId, from, to) {
		from = new Date(from)
		to = new Date(to)

		if (from >= to)
			throw new RequestError('The given timespan is invalid.')

		if (from.getFullYear() !== to.getFullYear())
			throw new RequestError('The query values from and to have to be in the same year.')

		let lunchbreaks = await ResourceLoader.loadLunchbreaks(groupId, from, to)
		lunchbreaks = await Promise.all(lunchbreaks.map(async (lunchbreak) => {
			lunchbreak = lunchbreak.toJSON()

			delete lunchbreak.groupId
			lunchbreak.comments = lunchbreak.comments.map(comment => this.convertComment(comment))
			lunchbreak.participants = lunchbreak.participants.map(participant => this.convertParticipant(participant))

			const group = await ResourceLoader.loadGroupById(groupId)
			const allMembers = group.members
			lunchbreak.responseless = allMembers.filter(member => {
				return lunchbreak.participants.find(p => p.member.username === member.username) === undefined
			})

			return lunchbreak
		}))
		return lunchbreaks
	}

	async getLunchbreak(groupId, date) {
		let lunchbreak = await ResourceLoader.loadLunchbreak(groupId, date)
		lunchbreak = lunchbreak.toJSON()

		// Restructuring Comment properties
		lunchbreak.comments = lunchbreak.comments.map(comment => this.convertComment(comment))
		lunchbreak.participants = lunchbreak.participants.map(participant => this.convertParticipant(participant))

		const group = await ResourceLoader.loadGroupById(groupId)
		const allMembers = group.members
		lunchbreak.responseless = allMembers.filter(member => {
			return lunchbreak.participants.find(p => p.member.username === member.username) === undefined
		})

		await user.can.readLunchbreak(lunchbreak)

		delete lunchbreak.groupId

		return lunchbreak
	}

	async createLunchbreak(groupId) {
		const today = new Date().toISOString().substring(0, 10)
		const lunchbreak = await Lunchbreak.build({ groupId, date: today })
		await user.can.createLunchbreak(lunchbreak)
		await lunchbreak.save()
		return await this.getLunchbreak(groupId, today)
	}

}

module.exports = new LunchbreakController()
