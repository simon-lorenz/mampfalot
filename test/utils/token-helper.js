const { users } = require('./scripts/test-data')
const request = require('supertest')('http://localhost:5001/api')

class TokenHelper {

	async getAuthorizationHeader(username) {
		return {
			Authorization: await this.getToken(username)
		}
	}

	async getToken(username) {
		const user = this.findUser(username)
		const token = await request
			.get('/auth')
			.auth(user.username, user.password)
			.then(res => res.body.token)
		return `Bearer ${token}`
	}

	findUser(username) {
		const user = users.find(user => user.username === username)
		if (user)
			return user
		else
			throw new Error(`User "${username}" could not be found!`)
	}

}

module.exports = new TokenHelper()
