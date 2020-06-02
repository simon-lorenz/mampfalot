const Boom = require('@hapi/boom')
const GroupRepository = require('./group-repository')
const { Lunchbreak, Participant, GroupMembers, User, Vote, Place, Absence, Comment } = require('../models')
const { Op } = require('sequelize')

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
		votes: participant.votes.map(vote => {
			delete vote.id
			return vote
		})
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

async function calculateResponseless(lunchbreak, groupId) {
	const group = await GroupRepository.getGroup(groupId)
	return group.members.filter(member => {
		const participates = lunchbreak.participants.find(p => p.member !== null && p.member.username === member.username)
		const absent = lunchbreak.absent.find(absent => absent.username === member.username)
		return !participates && !absent
	})
}

class LunchbreakRepository {
	async getLunchbreak(groupId, date) {
		let lunchbreak = await Lunchbreak.findOne({
			attributes: ['id', 'date'],
			where: {
				groupId: groupId,
				date: date
			},
			include: [
				{
					model: Participant,
					attributes: ['id'],
					include: [
						{
							model: GroupMembers,
							attributes: ['id', 'isAdmin', 'color'],
							as: 'member',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						},
						{
							model: Vote,
							attributes: ['id', 'points'],
							include: [
								{
									model: Place,
									attributes: ['id', 'name', 'foodType']
								}
							]
						}
					]
				},
				{
					model: Absence,
					attributes: ['memberId'],
					include: [
						{
							model: GroupMembers,
							as: 'member',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						}
					]
				},
				{
					model: Comment,
					attributes: ['id', 'text', 'createdAt', 'updatedAt'],
					include: [
						{
							model: GroupMembers,
							as: 'author',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						}
					]
				}
			],
			order: [[Comment, 'createdAt', 'DESC']]
		})

		if (lunchbreak) {
			lunchbreak = lunchbreak.toJSON()

			lunchbreak.comments = lunchbreak.comments.map(convertComment)
			lunchbreak.participants = lunchbreak.participants.map(convertParticipant)
			lunchbreak.absent = lunchbreak.absences.map(convertAbsence)
			delete lunchbreak.absences

			lunchbreak.responseless = await calculateResponseless(lunchbreak, groupId)

			return lunchbreak
		} else {
			throw Boom.notFound()
		}
	}

	async getLunchbreakId(groupId, date) {
		const lunchbreak = await Lunchbreak.findOne({
			attributes: ['id'],
			where: {
				groupId,
				date
			}
		})

		return lunchbreak.id
	}

	async getLunchbreaks(groupId, from, to) {
		let lunchbreaks = await Lunchbreak.findAll({
			attributes: ['id', 'date'],
			where: {
				groupId: groupId,
				date: {
					[Op.between]: [from, to]
				}
			},
			include: [
				{
					model: Participant,
					attributes: ['id'],
					include: [
						{
							model: GroupMembers,
							as: 'member',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						},
						{
							model: Vote,
							attributes: ['id', 'points'],
							include: [
								{
									model: Place,
									attributes: ['id', 'name', 'foodType']
								}
							]
						}
					]
				},
				{
					model: Absence,
					attributes: ['memberId'],
					include: [
						{
							model: GroupMembers,
							as: 'member',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						}
					]
				},
				{
					model: Comment,
					attributes: ['id', 'text', 'createdAt', 'updatedAt'],
					include: [
						{
							model: GroupMembers,
							as: 'author',
							include: [
								{
									model: User,
									attributes: ['username', 'firstName', 'lastName']
								}
							]
						}
					]
				}
			],
			order: [[Comment, 'createdAt', 'DESC']]
		})

		lunchbreaks = lunchbreaks.map(lunchbreak => lunchbreak.toJSON())

		const group = await GroupRepository.getGroup(groupId)

		lunchbreaks = lunchbreaks.map(lunchbreak => {
			lunchbreak.comments = lunchbreak.comments.map(convertComment)
			lunchbreak.participants = lunchbreak.participants.map(convertParticipant)
			lunchbreak.absent = lunchbreak.absences.map(convertAbsence)

			delete lunchbreak.absences

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
}

module.exports = new LunchbreakRepository()
