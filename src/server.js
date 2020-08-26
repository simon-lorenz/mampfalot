const Hapi = require('@hapi/hapi')

async function createServer(port) {
	const server = Hapi.server({
		port,
		router: {
			isCaseSensitive: true,
			stripTrailingSlash: true
		},
		routes: {
			cors: {
				origin: ['*']
			},
			validate: {
				options: {
					abortEarly: process.env.NODE_ENV === 'production'
				},
				failAction:
					// Enables specific validation error messages for development and testing.
					// See: https://github.com/hapijs/hapi/issues/3706
					process.env.NODE_ENV === 'production'
						? 'error'
						: (request, h, err) => {
								throw err
						  }
			}
		}
	})

	await server.register([require('./authentication/basic'), require('./authentication/jwt')])

	server.auth.default('jwt')

	await server.register([require('./util/logger'), require('./mails/mailer'), require('./util/objection')])

	await server.register([
		require('./authentication/authentication.router'),
		require('./lunchbreak/lunchbreaks.router'),
		require('./absence/absence.router'),
		require('./comment/comment.router'),
		require('./user/user.router'),
		require('./place/place.router'),
		require('./group/group.router'),
		require('./group-member/group-member.router'),
		require('./participant/participant.router'),
		require('./invitation/invitiation.router')
	])

	await server.ext('onPostStart', async server => {
		server.logger.info(`[Server] Running on ${server.info.uri}`)
		server.mailer.checkConnections()
	})

	await server.initialize()

	return server
}

module.exports = {
	createServer
}
