'use strict'

const { GroupMembers, Lunchbreak } = require('../models')
const { AuthorizationError } = require('./errors')

/**
 * This class is responsible for controlling a users access to resources.
 * It offers multiple functions for CRUD-operations on different resources.
 * These functions will mostly return either true or throw an Authorization- or
 * NotFoundError.
 */
class ResourceAccessControl {

	constructor (user) {
		this.user = user
	}

	async createComment(comment) {
		const lunchbreak = await Lunchbreak.findByPk(comment.lunchbreakId, { attributes: ['groupId'] })
		if (!this.user.isGroupMember(lunchbreak.groupId)) {
			throw new AuthorizationError('Comment', null, 'CREATE')
		}
	}

	async readComment(comment) {
		const lunchbreak = await Lunchbreak.findByPk(comment.lunchbreakId, { attributes: ['groupId'] })
		if (!this.user.isGroupMember(lunchbreak.groupId)) {
			throw new AuthorizationError('Comment', comment.id, 'READ')
		}
	}

	async updateComment(comment) {
		if (comment.userId !== this.user.id) {
			throw new AuthorizationError('Comment', comment.id, 'UPDATE')
		}
	}

	async deleteComment(comment) {
		if (comment.userId !== this.user.id) {
			throw new AuthorizationError('Comment', comment.id, 'DELETE')
		}
	}

	async readGroup(group) {
		if (!this.user.isGroupMember(group.id)) {
			throw new AuthorizationError('Group', group.id, 'READ')
		}
	}

	/**
	 * Checks if the user can read the groups of a user
	 */
	async readGroupCollection(user) {
		if (this.user.id !== user.id) {
			throw new AuthorizationError('GroupCollection', null, 'READ')
		}
	}

	async updateGroup(group) {
		if (!this.user.isGroupAdmin(group.id)) {
			throw new AuthorizationError('Group', group.id, 'UPDATE')
		}
	}

	async deleteGroup(group) {
		if (!this.user.isGroupAdmin(group.id)) {
			throw new AuthorizationError('Group', group.id, 'DELETE')
		}
	}

	async createGroupMember(member) {
		if (!this.user.isGroupAdmin(member.groupId)) {
			throw new AuthorizationError('GroupMember', null, 'CREATE')
		}
	}

	async readGroupMemberCollection(group) {
		if (!this.user.isGroupMember(group.id)) {
			throw new AuthorizationError('GroupMemberCollection', null, 'READ')
		}
	}

	async readInvitationCollection(group) {
		if (!this.user.isGroupMember(group.id)) {
			throw new AuthorizationError('InvitationCollection', null, 'READ')
		}
	}

	async readInvitationCollectionOfUser(user) {
		if (this.user.id !== user.id) {
			throw new AuthorizationError('InvitationCollection', null, 'READ')
		}
	}

	async createInvitation(invitation) {
		if (!this.user.isGroupMember(invitation.groupId)) {
			throw new AuthorizationError('Invitation', null, 'CREATE')
		}
	}

	async deleteInvitation(invitation) {
		if (this.user.isGroupMember(invitation.groupId)) {
			if (!this.user.isGroupAdmin(invitation.groupId)) {
				if (this.user.id !== invitation.fromId) {
					throw new AuthorizationError('Invitation', null, 'DELETE')
				}
			}
		} else {
			if (this.user.id !== invitation.toId) {
				throw new AuthorizationError('Invitation', null, 'DELETE')
			}
		}
	}

	async updateGroupMember(member) {
		const gainsAdminRights = member.isAdmin && !member.previous('isAdmin')
		const losesAdminRights = !member.isAdmin && member.previous('isAdmin')

		if (this.user.id === member.userId || this.user.isGroupAdmin(member.groupId)) {
			if (gainsAdminRights && !this.user.isGroupAdmin(member.groupId)) {
				throw new AuthorizationError('GroupMember', member.userId, 'UPDATE')
			}

			if (losesAdminRights) {
				const admins = await GroupMembers.findAll({
					where: {
						groupId: member.groupId,
						isAdmin: true
					}
				})

				if (admins.length === 1) {
					const err = new AuthorizationError('GroupMember', member.userId, 'UPDATE')
					err.message = 'This user is the last admin of this group and cannot revoke his rights.'
					throw err
				}
			}
		} else {
			throw new AuthorizationError('GroupMember', member.userId, 'UPDATE')
		}
	}

	async deleteGroupMember(member) {
		if (this.user.id === member.userId || this.user.isGroupAdmin(member.groupId)) {
			if (member.isAdmin) {
				const admins = await GroupMembers.findAll({
					where: {
						groupId: member.groupId,
						isAdmin: true
					}
				})

				if (admins.length === 1 && admins[0].userId === member.userId) {
					const err = new AuthorizationError('GroupMember', member.userId, 'DELETE')
					err.message = 'You are the last administrator of this group and cannot leave the group.'
					throw err
				}
			}
		} else {
			throw new AuthorizationError('GroupMember', member.userId, 'DELETE')
		}
	}

	async createLunchbreak(lunchbreak) {
		if (!this.user.isGroupMember(lunchbreak.groupId)) {
			throw new AuthorizationError('Lunchbreak', null, 'CREATE')
		}
	}

	async readLunchbreak(lunchbreak) {
		if (!this.user.isGroupMember(lunchbreak.groupId)) {
			throw new AuthorizationError('Lunchbreak', lunchbreak.id, 'READ')
		}
	}

	async updateLunchbreak(lunchbreak) {
		if (!this.user.isGroupAdmin(lunchbreak.groupId)) {
			throw new AuthorizationError('Lunchbreak', lunchbreak.id, 'UPDATE')
		}
	}

	async createParticipant(participant) {
		const lunchbreak = await Lunchbreak.findByPk(participant.lunchbreakId, { attributes: ['groupId'] })

		if (!this.user.isGroupMember(lunchbreak.groupId)) {
			throw new AuthorizationError('Participant', participant.id, 'CREATE')
		}
	}

	async readParticipant(participant) {
		if (!this.user.isGroupMember(participant.lunchbreak.groupId)) {
			throw new AuthorizationError('Participant', participant.id, 'READ')
		}
	}

	async deleteParticipant(participant) {
		if (this.user.id !== participant.userId) {
			throw new AuthorizationError('Participant', participant.id, 'DELETE')
		}
	}

	async createPlace(place) {
		if (!this.user.isGroupAdmin(place.groupId)) {
			throw new AuthorizationError('Place', null, 'CREATE')
		}
	}

	async readPlace(place) {
		if (!this.user.isGroupMember(place.groupId)) {
			throw new AuthorizationError('Place', place.id, 'READ')
		}
	}

	async updatePlace(place) {
		if (!this.user.isGroupAdmin(place.groupId)) {
			throw new AuthorizationError('Place', place.id, 'UPDATE')
		}
	}

	async deletePlace(place) {
		if (!this.user.isGroupAdmin(place.groupId)) {
			throw new AuthorizationError('Place', place.id, 'DELETE')
		}
	}

	async readUser(user) {
		if (this.user.id !== user.id) {
			throw new AuthorizationError('User', user.id, 'READ')
		}
	}

	async updateUser(user) {
		if (this.user.id !== user.id) {
			throw new AuthorizationError('User', user.id, 'UPDATE')
		}
	}

	async deleteUser(user) {
		if (this.user.id !== user.id) {
			throw new AuthorizationError('User', user.id, 'DELETE')
		}
	}

	async createVoteCollection(participant) {
		if (participant.userId !== this.user.id) {
			throw new AuthorizationError('VoteCollection', null, 'CREATE')
		}
	}

	async readVote(vote) {
		if (vote.participant.userId !== this.user.id) {
			throw new AuthorizationError('Vote', vote.id, 'READ')
		}
	}

	async deleteVote(vote) {
		if (vote.participant.userId !== this.user.id) {
			throw new AuthorizationError('Vote', vote.id, 'DELETE')
		}
	}
}

module.exports = ResourceAccessControl
