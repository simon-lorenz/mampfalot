const Boom = require('@hapi/boom')

const InvitationModel = require('./invitation.model')
const InvitationRepository = require('./invitation.repository')

const GroupMemberModel = require('../group-member/group-member.model')
const GroupRepository = require('../group/group.repository')
const UserRepository = require('../user/user.repository')

async function getInvitations(request, h) {
	const { groupId } = request.params
	return InvitationRepository.getInvitationsOfGroup(groupId)
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

	await InvitationModel.query().insert({
		groupId,
		fromId: userId,
		toId: invitedUserId
	})

	return h.response(await InvitationRepository.getInvitationOfGroupToUser(groupId, username)).code(201)
}

async function deleteInvitation(request, h) {
	const { groupId, username } = request.params

	const userId = await UserRepository.getUserIdByUsername(username)

	await InvitationModel.query().throwIfNotFound().delete().where({
		groupId,
		toId: userId
	})

	return h.response().code(204)
}

async function acceptInvitation(userId, groupId) {
	await InvitationModel.query().throwIfNotFound().delete().where({
		groupId,
		toId: userId
	})

	const colors = ['#ffa768', '#e0dbff', '#f5e97d', '#ffa1b7', '#948bf0', '#a8f08d']
	const randomColor = colors[Math.floor(Math.random() * colors.length)]

	await GroupMemberModel.query().insert({
		groupId: groupId,
		userId: userId,
		color: randomColor,
		isAdmin: false
	})
}

async function rejectInvitation(userId, groupId) {
	await InvitationModel.query().throwIfNotFound().delete().where({
		groupId,
		toId: userId
	})
}

module.exports = {
	getInvitationsOfAuthenticatedUser,
	deleteInvitationOfAuthenticatedUser,

	getInvitations,
	createInvitation,
	deleteInvitation
}
