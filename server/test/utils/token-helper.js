const supertest = require('supertest')

const { users } = require('../../src/knex/seeds')

const request = supertest('http://localhost:5001')

class TokenHelper {
	async getAuthorizationHeader(username) {
		return {
			Authorization: await this.getToken(username)
		}
	}

	async getToken(username) {
		const user = this.findUser(username)
		const token = await request
			.get('/authenticate')
			.auth(user.username, user.password)
			.then(res => res.body.token)
		return `Bearer ${token}`
	}

	findUser(username) {
		const user = users.find(user => user.username === username)
		if (user) {
			return user
		} else {
			throw new Error(`User "${username}" could not be found!`)
		}
	}
}

module.exports = new TokenHelper()
