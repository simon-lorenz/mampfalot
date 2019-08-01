const { users } = require('./scripts/test-data')
const request = require('supertest')('http://localhost:5001/api')

class SessionHelper {

	async getSessionCookie(username) {
		const user = this.findUser(username)
		return request
			.get('/authenticate')
			.auth(user.username, user.password)
			.then(res => res.header['set-cookie'][0])
	}

	findUser(username) {
		const user = users.find(user => user.username === username)
		if (user)
			return user
		else
			throw new Error(`User "${username}" could not be found!`)
	}

}

module.exports = new SessionHelper()
