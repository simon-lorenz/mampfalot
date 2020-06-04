const dotenv = require('dotenv')

dotenv.config()

const { createServer } = require('./src/server')
const { sequelize } = require('./src/models')

start()

async function start() {
	const server = await createServer(process.env.PORT)

	server.logger.info('[Application] Initializing...')
	server.logger.info(`[Config] Running in ${process.env.NODE_ENV} mode.`)
	server.logger.info(`[Config] Log Level is: ${process.env.LOG_LEVEL}`)
	server.logger.info(`[Config] Frontend URL: ${process.env.FRONTEND_BASE_URL}`)

	try {
		server.logger.info('[Database] Trying to connect to the database ...')
		await sequelize.authenticate()
		server.logger.info('[Database] Connection successfully established.')
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
