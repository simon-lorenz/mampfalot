const { ConnectionError } = require('sequelize')
const { createServer } = require('./src/server')
const { sequelize } = require('./src/sequelize')

const server = start()

async function start() {
	const server = await createServer(5000)

	server.logger.info('[Application] Initializing...')
	server.logger.info(`[Config] Running in ${process.env.NODE_ENV} mode.`)
	server.logger.info(`[Config] Log Level is: ${process.env.LOG_LEVEL}`)
	server.logger.info(`[Config] Frontend URL: ${process.env.FRONTEND_BASE_URL}`)

	try {
		const max_tries = 5
		for (let i = 1; i <= max_tries; i++) {
			try {
				server.logger.info(`[Database] Trying to connect... (${i}/${max_tries})...`)
				await sequelize.authenticate()
				server.logger.info('[Database] Connection successfully established.')
				break
			} catch (e) {
				if (e instanceof ConnectionError) {
					if (i === max_tries) {
						server.logger.info('[Database] Connection could not be established.')
						throw e
					} else {
						await new Promise(resolve => setTimeout(resolve, 1000))
					}
				} else {
					throw e
				}
			}
		}

		server.logger.info('[Database] Initializing sync...')
		await sequelize.sync()
		server.logger.info('[Database] Sync complete!')
	} catch (err) {
		if (err.name === 'SequelizeConnectionError') {
			server.logger.error({ error: err }, '[Database] Connection could not be established.')
			server.logger.fatal('Shutting down...')
		} else {
			server.logger.error({ error: err }, '[Database] Sync failed!')
			server.logger.fatal('Shutting down...')
		}

		process.exit(1)
	}

	server.mailer.checkConnections()

	await server.start()

	server.logger.info(`[Server] Running on ${server.info.uri}`)
}

process.on('unhandledRejection', err => {
	console.error('The process crashed unexpectedly and will be terminated.')
	console.error(err)
	process.exit(1)
})

process.on('SIGINT', () => {
	console.log('Stopping server after SIGINT...')

	server.stop({ timeout: 5000 }).then(err => {
		console.log('Server stopped.')
		process.exit(err ? 1 : 0)
	})
})
