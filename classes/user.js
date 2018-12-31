'use strict'

const ResourceAccessControl = require('../classes/resource-access-control')
const UserModel = require('../models').User
const GroupModel = require('../models').Group
const { AuthenticationError } = require('./errors')

class User {

	constructor(id) {
		this.id = id
		this.can = new ResourceAccessControl(this)
	}

	/**
	 * Retrieves necessary data about this
	 * user from the database.
	 */
	async init() {
		const finder = {
			attributes: [],
			where: {
				id: this.id
			},
			include: [{
				model: GroupModel,
				attributes: ['id'],
				through: {
					attributes: ['isAdmin'],
					as: 'config'
				}
			}]
		}

		const record = await UserModel.findOne(finder, { raw: true })

		if (record) {
			this.groups = record.groups
		} else {
			throw new AuthenticationError('This user does not exist anymore.')
		}
	}

	isGroupAdmin(groupId) {
		for (const group of this.groups) {
			if (group.id === parseInt(groupId)) {
				return group.config.isAdmin
			}
		}
		return false
	}

	isGroupMember(groupId) {
		for (const group of this.groups) {
			if (group.id === parseInt(groupId)) {
				return true
			}
		}
		return false
	}

	getGroupIds(adminOnly = false) {
		const groupIds = []
		for (const group of this.groups) {
			if (adminOnly) {
				if (group.config.isAdmin) {
					groupIds.push(group.id)
				}
			} else {
				groupIds.push(group.id)
			}
		}
		return groupIds
	}

}

module.exports = User
