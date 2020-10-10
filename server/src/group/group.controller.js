const Boom = require('@hapi/boom')
const moment = require('moment')

const GroupModel = require('./group.model')
const GroupRepository = require('./group.repository')

const GroupMemberModel = require('../group-member/group-member.model')

async function getGroup(request, h) {
	const { groupId } = request.params
	return GroupRepository.getGroup(groupId)
}

async function getGroupsOfAuthenticatedUser(request, h) {
	const { id } = request.auth.credentials
	return GroupRepository.getGroupsOfUser(id)
}

async function createGroup(request, h) {
	const { payload } = request

	// TODO: Can this be done with Joi?
	if (moment(payload.voteEndingTime, 'HH:mm:ss').isAfter(moment(payload.lunchTime, 'HH:mm:ss'))) {
		throw Boom.badRequest('"lunchTime" must be greater than voteEndingTime')
	}

	const { id } = await GroupModel.query().insert(payload)

	await GroupMemberModel.query().insert({
		groupId: id,
		userId: request.auth.credentials.id,
		color: '#80d8ff',
		isAdmin: true
	})

	return h.response(await GroupRepository.getGroup(id)).code(201)
}

async function updateGroup(request, h) {
	const { groupId } = request.params
	const { payload } = request

	// TODO: Can this be done with Joi?
	if (moment(payload.voteEndingTime, 'HH:mm:ss').isAfter(moment(payload.lunchTime, 'HH:mm:ss'))) {
		throw Boom.badRequest('"lunchTime" must be greater than voteEndingTime')
	}

	await GroupModel.query()
		.update(payload)
		.where({ id: groupId })

	return GroupRepository.getGroup(groupId)
}

async function deleteGroup(request, h) {
	const { groupId } = request.params

	await GroupModel.query()
		.delete()
		.where({ id: groupId })

	return h.response().code(204)
}

module.exports = {
	getGroup,
	createGroup,
	updateGroup,
	deleteGroup,

	getGroupsOfAuthenticatedUser
}
