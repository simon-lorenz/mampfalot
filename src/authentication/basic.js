const Boom = require('@hapi/boom')
const UserModel = require('../user/user.model')
const bcrypt = require('bcryptjs')

module.exports = {
	name: 'basic',
	register: async server => {
		await server.register(require('@hapi/basic'))

		server.auth.strategy('basic', 'basic', {
			validate: async (request, username, password) => {
				request.logger.info(`Attempting basic authentication...`)

				const user = await UserModel.unscoped().findOne({
					where: {
						username: username
					},
					attributes: ['id', 'username', 'password', 'verified'],
					raw: true
				})

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
