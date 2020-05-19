const { User } = require('../models')
const { NotFoundError } = require('../util/errors')

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
			throw new NotFoundError('User', username)
		}
	}
}

module.exports = new UserRepository()
