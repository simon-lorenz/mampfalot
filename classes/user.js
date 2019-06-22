'use strict'

const ResourceAccessControl = require('../classes/resource-access-control')
const UserModel = require('../models').User
const GroupModel = require('../models').Group
const { AuthenticationError } = require('./errors')
const jwt = require('jsonwebtoken')

class User {

	constructor() {
		this.can = new ResourceAccessControl(this)
		this.groups = []

		this.init = async (req, res, next) => {
			const token = this.getTokenFromAuthorizationHeader(req)
			const payload = this.verifyToken(token)
			await this.setId(payload.id)
			next()
		}
	}

	async setId(id) {
		const me = await UserModel.findByPk(id, {
			attributes: ['id', 'username']
		})

		this.id = me.id
		this.username = me.username
		await this.loadGroups()
	}

	/**
	 * Returns the jwt from the authorization header of a request.
	 * If the request contains no authorization header, this function will throw an AuthenticationError.
	 * @param {string} request
	 * @return {string} A jwt
	 * @throws  {AuthenticationError}
	 */
	getTokenFromAuthorizationHeader(request) {
		const authorizationHeader = request.headers['authorization']
		if (authorizationHeader)
			return authorizationHeader.split(' ')[1]
		else
			throw new AuthenticationError('This request requires authentication.')
	}

	/**
	 * Verifies a jwt and returns the content.
	 * @param {string} token A jwt
	 * @returns {object}
	 */
	verifyToken(token) {
		try {
			return jwt.verify(token, process.env.SECRET_KEY)
		} catch (error) {
			throw new AuthenticationError('The provided token is invalid.')
		}
	}

	async loadGroups() {
		const userGroups = await UserModel.findOne({
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
		}, { raw: true })

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

		if (group)
			return group.config.isAdmin
		else
			return false
	}

	/**
	 * @param {number} groupId
	 */
	isGroupMember(groupId) {
		return this.groups.find(group => group.id === groupId) !== undefined
	}

}

module.exports = new User()
