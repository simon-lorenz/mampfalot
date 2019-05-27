'use strict'

const ResourceLoader = require('../classes/resource-loader')
const user = require('../classes/user')

class LunchbreakController {

	async getLunchbreaks(groupId, from, to) {
		console.log(`Getting lunchbreaks for group ${groupId}`)
		console.log(`${from} ${to}`)
	}

	async getLunchbreak(groupId, date) {
		let lunchbreak = await ResourceLoader.loadLunchbreak(groupId, date)
		lunchbreak = lunchbreak.toJSON()

		// Restructuring Comment properties
		lunchbreak.comments = lunchbreak.comments.map(comment => {
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
		})

		lunchbreak.participants = lunchbreak.participants.map(participant => {
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
		})

		const group = await ResourceLoader.loadGroupById(groupId)
		const allMembers = group.members
		lunchbreak.responseless = allMembers.filter(member => {
			return lunchbreak.participants.find(p => p.member.username === member.username) === undefined
		})

		await user.can.readLunchbreak(lunchbreak)

		delete lunchbreak.groupId

		return lunchbreak
	}

}

module.exports = new LunchbreakController()
