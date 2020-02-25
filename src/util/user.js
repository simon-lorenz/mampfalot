const cls = require('cls-hooked')
const ResourceAccessControl = require('../classes/resource-access-control')
const UserModel = require('../models').User
const GroupModel = require('../models').Group
const logger = require('./logger')
const { verifyToken, getTokenFromAuthorizationHeader } = require('./authentication')

const userNamespace = cls.createNamespace('user')

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
		const { groups } = await UserModel.findOne(
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

		this.groups = groups
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

module.exports = {
	/**
	 * Verifies the json web token and initializes the user.
	 */
	async initializeUser(req, res, next) {
		userNamespace.bindEmitter(req)
		userNamespace.bindEmitter(res)

		const token = getTokenFromAuthorizationHeader(req)
		const { id } = verifyToken(token)

		const user = new User()
		await user.setId(id)

		logger.attachUsername(user.username)
		userNamespace.run(() => {
			userNamespace.set('user', user)
			next()
		})
	},
	getUser() {
		return userNamespace.get('user')
	}
}
