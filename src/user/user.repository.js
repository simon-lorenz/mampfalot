const UserModel = require('./user.model')

class UserRepository {
	async getUser(userId) {
		return await UserModel.query()
			.modify('private')
			.where({ id: userId })
			.first()
	}

	async getUserIdByUsername(username) {
		const { id } = await UserModel.query()
			.throwIfNotFound()
			.select('id')
			.where({ username })
			.first()

		return id
	}

	async getUsernameById(userId) {
		const { username } = await UserModel.query()
			.select('username')
			.where({ id: userId })
			.first()

		return username
	}

	async usernameExists(username) {
		const user = await UserModel.query()
			.select('id')
			.where({ username })

		return user.length > 0
	}
}

module.exports = new UserRepository()
