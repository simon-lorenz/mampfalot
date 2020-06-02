const Boom = require('@hapi/boom')
const { User } = require('../models')

class UserRepository {
	async getUser(userId) {
		return await User.findOne({
			attributes: ['username', 'firstName', 'lastName', 'email'],
			where: {
				id: userId
			}
		})
	}

	async getUserIdByUsername(username) {
		const user = await User.findOne({
			attributes: ['id'],
			where: {
				username
			}
		})

		if (user) {
			return user.id
		} else {
			throw Boom.notFound()
		}
	}

	async getUsernameById(userId) {
		const { username } = await User.findByPk(userId, { attributes: ['username'] })
		return username
	}

	async usernameExists(username) {
		const user = await User.findOne({
			attributes: ['id'],
			where: { username }
		})

		return user ? true : false
	}
}

module.exports = new UserRepository()
