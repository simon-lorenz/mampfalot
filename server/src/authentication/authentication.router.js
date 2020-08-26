const jwt = require('jsonwebtoken')

module.exports = {
	name: 'authentication-router',
	register: async server => {
		server.route({
			method: 'GET',
			path: '/authenticate',
			options: {
				auth: 'basic'
			},
			handler: async request => {
				return {
					token: jwt.sign(
						{
							id: request.auth.credentials.id
						},
						process.env.SECRET_KEY,
						{ expiresIn: '10h' }
					)
				}
			}
		})
	}
}
