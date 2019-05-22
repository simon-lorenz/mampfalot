'use strict'

const user = require('../classes/user')
const { AuthorizationError, AuthenticationError, RequestError } = require('../classes/errors')
const ResourceLoader = require('../classes/resource-loader')
const { User } = require('../models')
const bcrypt = require('bcryptjs')

class UserController {

	async getUser(userId) {
		if (userId !== user.id)
			throw new AuthorizationError('User', userId, 'READ')

		return await ResourceLoader.loadUserWithEmail(userId)
	}

	async deleteUser(userId) {
		if (userId !== user.id)
			throw new AuthorizationError('User', userId, 'DELETE')

		await User.destroy({ where: { id: userId } })
	}

	async updateUser(userId, values) {
		if (userId !== user.id)
			throw new AuthorizationError('User', userId, 'UPDATE')

		const userResource = await User.findOne({
			where: {
				id: userId
			}
		})

		if (values.password) {
			if (!values.currentPassword) {
				throw new RequestError('You need to provide your current password to change it.')
			}

			if (await this.checkPassword(userResource.username, values.currentPassword) === false)
				throw new AuthenticationError('The provided credentials are incorrect.')
			else
				userResource.password = values.password
		}

		if (values.username) { userResource.username = values.username }

		if (values.firstName === '' || values.firstName === null)
			userResource.firstName = null
		else if (values.firstName)
			userResource.firstName = values.firstName.trim()

		if (values.lastName === '' || values.lastName === null)
			userResource.lastName = null
		else if (values.lastName)
			userResource.lastName = values.lastName.trim()

		userResource.email = values.email.trim()

		await userResource.save()
		return await ResourceLoader.loadUserWithEmail(userId)
	}

	async checkPassword(username, password) {
		const user = await User.findOne({
			attributes: ['password'],
			where: {
				username: username
			}
		})
		return await bcrypt.compare(password, user.password)
	}
}

module.exports = new UserController()

