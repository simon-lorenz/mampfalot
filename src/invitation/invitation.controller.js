const Boom = require('@hapi/boom')
const GroupMemberModel = require('../group-member/group-member.model')
const InvitationModel = require('./invitation.model')
const InvitationRepository = require('../invitation/invitation.repository')
const UserRepository = require('../user/user.repository')
const GroupRepository = require('../group/group.repository')

async function getInvitations(request, h) {
	const { groupId } = request.params

	const group = await GroupRepository.getGroup(groupId)
	const invitations = await InvitationRepository.getInvitationsOfGroup(groupId)

	return invitations.map(invitation => {
		return {
			...invitation.toJSON(),
			group
		}
	})
}

async function getInvitationsOfAuthenticatedUser(request, h) {
	const { id } = request.auth.credentials
	return InvitationRepository.getInvitationsOfUser(id)
}

async function deleteInvitationOfAuthenticatedUser(request, h) {
	const { accept } = request.query
	const { groupId } = request.params
	const { id } = request.auth.credentials

	if (accept) {
		await acceptInvitation(id, groupId)
	} else {
		await rejectInvitation(id, groupId)
	}

	return h.response().code(204)
}

async function createInvitation(request, h) {
	const { groupId, username } = request.params
	const userId = request.auth.credentials.id

	const invitedUserId = await UserRepository.getUserIdByUsername(username)
	const group = await GroupRepository.getGroup(groupId)

	if (group.members.find(member => member.username === username)) {
		throw Boom.badRequest('This user is already a group member')
	}

	if (await InvitationModel.findOne({ where: { toId: invitedUserId, groupId } })) {
		throw Boom.badRequest('This user is already invited')
	}

	await InvitationModel.create({
		groupId,
		fromId: userId,
		toId: invitedUserId
	})

	const createdInvitation = await InvitationRepository.getInvitationOfGroupToUser(groupId, username)

	return h
		.response({
			...createdInvitation.toJSON(),
			group: await GroupRepository.getGroup(groupId)
		})
		.code(201)
}

async function deleteInvitation(request, h) {
	const { groupId, username } = request.params

	const userId = await UserRepository.getUserIdByUsername(username)

	const affectedRows = await InvitationModel.destroy({
		where: {
			groupId,
			toId: userId
		}
	})

	if (affectedRows === 0) {
		throw Boom.notFound()
	} else {
		return h.response().code(204)
	}
}

async function acceptInvitation(userId, groupId) {
	const affectedRows = await InvitationModel.destroy({
		where: {
			groupId,
			toId: userId
		}
	})

	if (affectedRows === 0) {
		throw Boom.notFound()
	}

	const colors = ['#ffa768', '#e0dbff', '#f5e97d', '#ffa1b7', '#948bf0', '#a8f08d']
	const randomColor = colors[Math.floor(Math.random() * colors.length)]

	await GroupMemberModel.create({
		groupId: groupId,
		userId: userId,
		color: randomColor,
		isAdmin: false
	})
}

async function rejectInvitation(userId, groupId) {
	const affectedRows = await InvitationModel.destroy({
		where: {
			groupId,
			toId: userId
		}
	})

	if (affectedRows === 0) {
		throw Boom.notFound()
	}
}

module.exports = {
	getInvitationsOfAuthenticatedUser,
	deleteInvitationOfAuthenticatedUser,

	getInvitations,
	createInvitation,
	deleteInvitation
}
