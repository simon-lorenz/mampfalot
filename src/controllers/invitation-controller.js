const Sequelize = require('sequelize')
const { Invitation, GroupMembers } = require('../models')
const { NotFoundError, AuthorizationError } = require('../util/errors')
const { GroupRepository, InvitationRepository, UserRepository } = require('../repositories')

class InvitationController {
	constructor(user) {
		this.user = user
	}

	async getInvitations(groupId) {
		if (!this.user.isGroupMember(groupId)) {
			throw new AuthorizationError('Group', groupId, 'READ')
		}

		const group = await GroupRepository.getGroup(groupId)
		const invitations = await InvitationRepository.getInvitationsOfGroup(groupId)

		return invitations.map(invitation => {
			return {
				...invitation.toJSON(),
				group
			}
		})
	}

	async getInvitationsOfCurrentUser() {
		return InvitationRepository.getInvitationsOfUser(this.user.id)
	}

	async inviteUser(id, username) {
		if (!this.user.isGroupAdmin(id)) {
			throw new AuthorizationError('Invitation', null, 'CREATE')
		}

		const userId = await UserRepository.getUserIdByUsername(username)

		if (!userId) {
			throw new NotFoundError('User', username)
		}

		try {
			await Invitation.create({
				groupId: id,
				fromId: this.user.id,
				toId: userId
			})

			const createdInvitation = await InvitationRepository.getInvitationOfGroupToUser(id, username)
			return {
				...createdInvitation.toJSON(),
				group: await GroupRepository.getGroup(id)
			}
		} catch (error) {
			// The invitation model has two internal values, fromId and toId.
			// For a cleaner api these values are externally simply known as from and to.
			// Thats why we need to format the "field" values of a possible Validation Error.
			if (error instanceof Sequelize.ValidationError) {
				for (const item of error.errors) {
					if (item.path === 'toId') {
						item.path = 'to'
					}

					if (item.path === 'fromId') {
						item.path = 'from'
					}

					if (item.message === 'This user is already invited.') {
						item.path = 'username'
						item.value = username
					}
				}
			}

			throw error
		}
	}

	async withdrawInvitation(groupId, username) {
		if (!this.user.isGroupAdmin(groupId)) {
			throw new AuthorizationError('Invitation', null, 'DELETE')
		}

		const userId = await UserRepository.getUserIdByUsername(username)

		const affectedRows = await Invitation.destroy({
			where: {
				groupId,
				toId: userId
			}
		})

		if (affectedRows === 0) {
			throw new NotFoundError('Invitation')
		}
	}

	async acceptInvitation(userId, groupId) {
		const affectedRows = await Invitation.destroy({
			where: {
				groupId,
				toId: userId
			}
		})

		if (affectedRows === 0) {
			throw new NotFoundError('Invitation')
		}

		const colors = ['#ffa768', '#e0dbff', '#f5e97d', '#ffa1b7', '#948bf0', '#a8f08d']
		const randomColor = colors[Math.floor(Math.random() * colors.length)]

		await GroupMembers.create({
			groupId: groupId,
			userId: userId,
			color: randomColor,
			isAdmin: false
		})
	}

	async rejectInvitation(userId, groupId) {
		const affectedRows = await Invitation.destroy({
			where: {
				groupId,
				toId: userId
			}
		})

		if (affectedRows === 0) {
			throw new NotFoundError('Invitation')
		}
	}
}

module.exports = InvitationController
