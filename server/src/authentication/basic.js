const Boom = require('@hapi/boom')
const bcrypt = require('bcryptjs')

const UserModel = require('../user/user.model')

module.exports = {
	name: 'basic',
	register: async server => {
		await server.register(require('@hapi/basic'))

		server.auth.strategy('basic', 'basic', {
			validate: async (request, username, password) => {
				request.logger.info(`Attempting basic authentication...`)

				const user = await UserModel.query()
					.select(['id', 'username', 'password', 'verified'])
					.where({ username })
					.first()

				if (!user) {
					throw Boom.unauthorized('Bad username or password')
				}

				if (!user.verified) {
					throw Boom.unauthorized('This account is not verified yet')
				}

				const passwordMatch = await bcrypt.compare(password, user.password)

				if (!passwordMatch) {
					throw Boom.unauthorized('Bad username or password')
				}

				request.logger.info(`Basic authentication successful`)

				return { isValid: true, credentials: { id: user.id } }
			}
		})
	}
}
