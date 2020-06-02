const pino = require('pino')
const uuid = require('uuid')

module.exports = {
	name: 'logging',
	register: async server => {
		const logger = pino({
			level: process.env.LOG_LEVEL,
			redact: ['req.headers.authorization']
		})

		server.decorate('server', 'logger', logger)

		server.ext('onRequest', (request, h) => {
			request.info.id = uuid.v4()
			request.logger = logger.child({ id: request.info.id })
			return h.continue
		})

		server.ext('onPostAuth', (request, h) => {
			const user = request.auth.credentials ? request.auth.credentials.username : undefined
			request.logger = logger.child({ id: request.info.id, user })
			return h.continue
		})

		server.ext('onPreResponse', (request, h) => {
			const response = request.response

			if (response.isBoom) {
				if (response.output.statusCode === 500) {
					request.logger.error({ err: response }, 'Server error')
				} else {
					request.logger.info({ err: response.output }, 'Request error')
				}
			}

			return h.continue
		})

		server.events.on('response', request => {
			const remoteAddress = request.info.remoteAddress
			const method = request.method.toUpperCase()
			const path = request.path
			const statusCode = request.response.statusCode
			const responseTime = request.info.responded - request.info.received
			const contentLength = request.response.headers['content-length'] || 0

			request.logger.info(`${remoteAddress} - ${method} ${path} ${statusCode} ${contentLength} - ${responseTime} ms`)
		})
	}
}
