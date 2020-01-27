'use strict'

const { Invitation, User, Group, Place, GroupMembers } = require('../models')
const GroupController = require('./group-controller')
const Sequelize = require('sequelize')
const { NotFoundError } = require('../classes/errors')
const ResourceLoader = require('../classes/resource-loader')

class InvitationController {

	constructor(user) {
		this.user = user
	}

	async getInvitations(groupId) {
		const groupController = new GroupController(this.user)
		const group = await groupController.getGroupById(groupId)
		await this.user.can.readInvitationCollection(group)

		const invitations = await Invitation.findAll({
			attributes: [],
			where: {
				groupId: group.id
			},
			include: [
				{
					model: User,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: User,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName']
				}
			]
		})

		return invitations.map(invitation => {
			const result = invitation.toJSON()
			result.group = group
			return result
		})
	}

	async getInvitation(groupId, username) {
		const invitation = await Invitation.findOne({
			attributes: [],
			where: {
				groupId: groupId
			},
			include: [
				{
					model: User,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: User,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName'],
					where: {
						username: username
					}
				}
			]
		})

		const result = invitation.toJSON()
		result.group = await ResourceLoader.loadGroupById(groupId)
		return result
	}

	async getInvitationsOfCurrentUser() {
		return await Invitation.findAll({
			attributes: [],
			where: {
				toId: this.user.id
			},
			include: [
				{
					model: Group,
					include: [
						{
							model: Place,
							attributes: ['id', 'name', 'foodType']
						},
						{
							model: User,
							attributes: ['username', 'firstName', 'lastName'],
							as: 'members',
							through: {
								as: 'config',
								attributes: ['color', 'isAdmin']
							}
						}
					]
				},
				{
					model: User,
					as: 'from',
					attributes: ['username', 'firstName', 'lastName']
				},
				{
					model: User,
					as: 'to',
					attributes: ['username', 'firstName', 'lastName']
				}
			]
		})
	}

	async inviteUser(id, username) {
		const invitedUser = await User.findOne({
			attributes: ['id'],
			where: {
				username: username
			}
		})

		if (!invitedUser)
			throw new NotFoundError('User', username)

		const invitation = await Invitation.build({
			groupId: id,
			fromId: this.user.id,
			toId: invitedUser.id
		})

		await this.user.can.createInvitation(invitation)

		try {
			await invitation.save()
		} catch (error) {
			// The invitation model has two internal values, fromId and toId.
			// For a cleaner api these values are externally simply known as from and to.
			// Thats why we need to format the "field" values of a possible Validation Error.
			if (error instanceof Sequelize.ValidationError) {
				for (const item of error.errors) {
					if (item.path === 'toId') item.path = 'to'
					if (item.path === 'fromId') item.path = 'from'

					if (item.message === 'This user is already invited.') {
						item.path = 'username'
						item.value = username
					}
				}
			}
			throw error
		}

		return await this.getInvitation(id, username)
	}

	async withdrawInvitation(groupId, username) {
		const invitation = await Invitation.findOne({
			where: {
				groupId: groupId,
			},
			include: [
				{
					model: User,
					as: 'to',
					where: {
						username: username
					}
				}
			]
		})

		if (!invitation)
			throw new NotFoundError('Invitation')

		await this.user.can.deleteInvitation(invitation)
		await invitation.destroy()
	}

	async acceptInvitation(userId, groupId) {
		const invitation = await Invitation.findOne({
			where: {
				groupId: groupId,
				toId: userId
			}
		})

		if (!invitation)
			throw new NotFoundError('Invitation')

		const colors = ['#ffa768', '#e0dbff', '#f5e97d', '#ffa1b7', '#948bf0', '#a8f08d']
		const randomColor = colors[Math.floor(Math.random() * colors.length)]

		await GroupMembers.create({
			groupId: groupId,
			userId: userId,
			color: randomColor,
			isAdmin: false
		})

		await invitation.destroy()
	}

	async rejectInvitation(userId, groupId) {
		const invitation = await Invitation.findOne({
			where: {
				groupId: groupId,
				toId: userId
			}
		})

		if (!invitation)
			throw new NotFoundError('Invitation')

		await invitation.destroy()
	}

}

module.exports = InvitationController
