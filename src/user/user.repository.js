const Boom = require('@hapi/boom')
const UserModel = require('./user.model')

class UserRepository {
	async getUser(userId) {
		return await UserModel.findOne({
			attributes: ['username', 'firstName', 'lastName', 'email'],
			where: {
				id: userId
			}
		})
	}

	async getUserIdByUsername(username) {
		const user = await UserModel.findOne({
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
		const { username } = await UserModel.findByPk(userId, { attributes: ['username'] })
		return username
	}

	async usernameExists(username) {
		const user = await UserModel.findOne({
			attributes: ['id'],
			where: { username }
		})

		return user ? true : false
	}
}

module.exports = new UserRepository()
