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

	if (process.env.NODE_ENV === 'test') {
		const tk = require('timekeeper')
		tk.reset()
		if (process.env.TIME !== '') {
			const simulatedTime = process.env.TIME
			const newSystemTime = new Date()

			newSystemTime.setUTCHours(simulatedTime.split(':')[0])
			newSystemTime.setUTCMinutes(simulatedTime.split(':')[1])
			newSystemTime.setUTCSeconds(simulatedTime.split(':')[2])

			if (process.env.DATE !== '') {
				const simulatedDate = process.env.DATE
				newSystemTime.setUTCDate(simulatedDate.split('.')[0])
				newSystemTime.setUTCMonth(Number(simulatedDate.split('.')[1]) - 1)
				newSystemTime.setUTCFullYear(simulatedDate.split('.')[2])
			}

			tk.freeze(newSystemTime)
		}
	}

	await server.register(require('./util/logger'))

	await server.register([require('./util/authentication/basic'), require('./util/authentication/jwt')])

	server.auth.default('jwt')

	await server.register(require('./util/mailer'))

	await server.register(
		[
			require('./router/authenticate'),
			require('./router/lunchbreaks'),
			require('./router/absence'),
			require('./router/comments'),
			require('./router/users'),
			require('./router/places'),
			require('./router/groups'),
			require('./router/group-members'),
			require('./router/participation'),
			require('./router/invitiations')
		],
		{
			routes: { prefix: '/api' }
		}
	)

	return server
}

module.exports = {
	createServer
}
