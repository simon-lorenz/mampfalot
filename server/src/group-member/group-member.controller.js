const Boom = require('@hapi/boom')

const GroupMemberModel = require('./group-member.model')
const GroupMemberRepository = require('./group-member.repository')

const UserRepository = require('../user/user.repository')

async function deleteMember(request, h) {
	const { groupId, username } = request.params

	const member = await GroupMemberRepository.getMember(groupId, username)

	if (member.isAdmin) {
		const admins = await GroupMemberRepository.getAdmins(groupId)
		if (admins.length === 1) {
			throw Boom.forbidden('You are the last administrator of this group and cannot leave the group')
		}
	}

	const userId = await UserRepository.getUserIdByUsername(username)

	await GroupMemberModel.query()
		.delete()
		.where({
			groupId,
			userId
		})

	return h.response().code(204)
}

async function updateMember(request, h) {
	const { groupId, username } = request.params
	const { payload } = request

	const userId = await UserRepository.getUserIdByUsername(username)

	const isAdmin = groupId => request.auth.credentials.scope.includes(`admin:${groupId}`)

	if (payload.isAdmin && !isAdmin(groupId)) {
		throw Boom.forbidden('You cannot grant yourself admin rights')
	}

	if (payload.isAdmin === false) {
		const admins = await GroupMemberRepository.getAdmins(groupId)
		if (admins.length === 1 && admins.find(admin => admin.userId === userId)) {
			throw Boom.forbidden('You are the last admin and cannot revoke your rights')
		}
	}

	await GroupMemberModel.query()
		.update(payload)
		.where({
			groupId,
			userId
		})

	return GroupMemberRepository.getMember(groupId, username)
}

module.exports = {
	updateMember,
	deleteMember
}
