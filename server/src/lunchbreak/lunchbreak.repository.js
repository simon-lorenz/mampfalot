const Boom = require('@hapi/boom')

const LunchbreakModel = require('./lunchbreak.model')

const GroupMemberRepository = require('../group-member/group-member.repository')

function convertComment(comment) {
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

function convertParticipant(participant) {
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
		votes: participant.votes
	}
}

function convertAbsence(absence) {
	return {
		username: absence.member.user.username,
		firstName: absence.member.user.firstName,
		lastName: absence.member.user.lastName,
		config: {
			color: absence.member.color,
			isAdmin: absence.member.isAdmin
		}
	}
}

function calculateResponseless(lunchbreak, groupMembers) {
	return groupMembers.filter(member => {
		const participates = lunchbreak.participants.find(p => p.member !== null && p.member.username === member.username)
		const absent = lunchbreak.absent.find(absent => absent.username === member.username)
		return !participates && !absent
	})
}

class LunchbreakRepository {
	async getLunchbreak(groupId, date, id) {
		if (!groupId && !date && !id) {
			throw Boom.badImplementation('Missing parameter for getLunchbreak')
		}

		const lunchbreak = await LunchbreakModel.query()
			.skipUndefined()
			.throwIfNotFound()
			.select(['lunchbreaks.id', 'lunchbreaks.groupId', 'lunchbreaks.date'])
			.withGraphFetched(
				`[
						absent.member.user,
						comments(orderByCreation).author.user,
						participants.[member.user, votes(voteAttributes).place(placeAttributes)]
				]`
			)
			.modifiers({
				orderByCreation(builder) {
					builder.orderBy('createdAt', 'desc')
				},
				placeAttributes(builder) {
					builder.select(['id', 'name', 'foodType'])
				},
				voteAttributes(builder) {
					builder.select(['points'])
				}
			})
			.where('lunchbreaks.groupId', '=', groupId)
			.where('lunchbreaks.date', '=', date)
			.where('lunchbreaks.id', '=', id)
			.first()

		const members = await GroupMemberRepository.getMembers(lunchbreak.groupId)

		lunchbreak.absent = lunchbreak.absent.map(convertAbsence)
		lunchbreak.comments = lunchbreak.comments.map(convertComment)
		lunchbreak.participants = lunchbreak.participants.map(convertParticipant)
		lunchbreak.responseless = await calculateResponseless(lunchbreak, members)

		return lunchbreak
	}

	async getLunchbreakId(groupId, date) {
		const { id } = await LunchbreakModel.query()
			.select(['id'])
			.where({ groupId, date })
			.first()

		return id
	}

	async getLunchbreaks(groupId, from, to) {
		const lunchbreaks = await LunchbreakModel.query()
			.throwIfNotFound()
			.select(['lunchbreaks.id', 'lunchbreaks.date'])
			.withGraphFetched(
				`[
						absent.member.user,
						comments(orderByCreation).author.user,
						participants.[member.user, votes(voteAttributes).place(placeAttributes)]
				]`
			)
			.modifiers({
				orderByCreation(builder) {
					builder.orderBy('createdAt', 'desc')
				},
				placeAttributes(builder) {
					builder.select(['id', 'name', 'foodType'])
				},
				voteAttributes(builder) {
					builder.select(['points'])
				}
			})
			.where('lunchbreaks.groupId', '=', groupId)
			.whereBetween('lunchbreaks.date', [from, to])

		const members = await GroupMemberRepository.getMembers(groupId)

		return lunchbreaks.map(lunchbreak => {
			lunchbreak.absent = lunchbreak.absent.map(convertAbsence)
			lunchbreak.comments = lunchbreak.comments.map(convertComment)
			lunchbreak.participants = lunchbreak.participants.map(convertParticipant)
			lunchbreak.responseless = calculateResponseless(lunchbreak, members)

			return lunchbreak
		})
	}
}

module.exports = new LunchbreakRepository()
