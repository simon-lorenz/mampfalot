const logger = require('pino')()
const { createServer } = require('./src/server')
const { connectToDatabase, runMigrations } = require('./src/util/util')

start()

async function start() {
	logger.info('[Application] Initializing...')
	logger.info(`[Config] Running in ${process.env.NODE_ENV} mode.`)
	logger.info(`[Config] Log Level is: ${process.env.LOG_LEVEL}`)
	logger.info(`[Config] Frontend URL: ${process.env.FRONTEND_BASE_URL}`)

	await connectToDatabase(5, logger)
	await runMigrations(logger)

	const server = await createServer(5000)

	await server.start()
}

process.on('unhandledRejection', err => {
	logger.fatal({ err }, 'The process crashed unexpectedly and will be terminated.')
	process.exit(1)
})
