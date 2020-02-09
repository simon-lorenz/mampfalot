const ResourceAccessControl = require('./resource-access-control')
const UserModel = require('../models').User
const GroupModel = require('../models').Group
const { AuthenticationError } = require('./errors')

class User {
	constructor() {
		this.can = new ResourceAccessControl(this)
		this.groups = []
	}

	async setId(id) {
		const me = await UserModel.findByPk(id, {
			attributes: ['id', 'username']
		})

		this.id = me.id
		this.username = me.username
		await this.loadGroups()
	}

	async loadGroups() {
		const userGroups = await UserModel.findOne(
			{
				attributes: [],
				where: {
					id: this.id
				},
				include: [
					{
						model: GroupModel,
						attributes: ['id'],
						through: {
							attributes: ['isAdmin'],
							as: 'config'
						}
					}
				]
			},
			{ raw: true }
		)

		if (userGroups) {
			this.groups = userGroups.groups
		} else {
			throw new AuthenticationError('This user does not exist anymore.')
		}
	}

	/**
	 * @param {number} groupId
	 */
	isGroupAdmin(groupId) {
		const group = this.groups.find(group => group.id === groupId)

		if (group) {
			return group.config.isAdmin
		} else {
			return false
		}
	}

	/**
	 * @param {number} groupId
	 */
	isGroupMember(groupId) {
		return this.groups.find(group => group.id === groupId) !== undefined
	}
}

module.exports = User
