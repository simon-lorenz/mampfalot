'use strict'

const app = require('./app')
const PORT = process.env.PORT || 5000
const sequelize = require('./models').sequelize
const mailer = require('./util/mailer')
const logger = require('./util/logger')

async function start() {
	logger.info('[Application] Initializing...')
	logger.info(`[Config] Running in ${process.env.NODE_ENV} mode.`)
	logger.info(`[Config] Log Level is: ${process.env.LOG_LEVEL}`)
	logger.info(`[Config] Frontend URL: ${process.env.FRONTEND_BASE_URL}`)

	try {
		logger.info('[Database] Trying to connect to the database ...')
		await sequelize.authenticate()
		logger.info('[Database] Connection successfully established.')
		logger.info('[Database] Initializing sync...')
		await sequelize.sync()
		logger.info('[Database] Sync complete!')
	} catch (err) {
		if (err.name === 'SequelizeConnectionError') {
			logger.error({ error: err }, '[Database] Connection could not be established.')
			logger.fatal('Shutting down...')
			process.exit()
		} else {
			logger.error({ error: err }, '[Database] Sync failed!')
			logger.fatal('Shutting down...')
			process.exit()
		}
	}

	await mailer.checkConnections()

	app.listen(PORT, () => logger.info(`[Server] Listening to port ${PORT}`))
}

start()
