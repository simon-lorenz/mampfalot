'use strict'

const app = require('./app')
const PORT = process.env.PORT || 5000
const sequelize = require('./models').sequelize
const mailer = require('./util/mailer')

app.listen(PORT, () => {
	console.log(`[Config] Launched in ${process.env.NODE_ENV} mode.`)
	console.log(`[Config] Listening to port ${PORT}`)
	console.log(`[Config] Frontend URL: ${process.env.FRONTEND_BASE_URL}`)
	console.log('[Database] Trying to connect to the database ...')
	sequelize.authenticate()
		.then(() => console.log('[Database] Connection successfully established.'))
		.then(async () => {
			try {
				console.log('[Database] Initializing sync...')
				await sequelize.sync()
				console.log('[Database] Sync complete!')
			} catch (err) {
				console.log('[Database] Sync failed!')
				console.error(JSON.stringify(err))
				console.info('Shutting down...')
				process.exit()
			}
		})
		.catch((err) => {
			console.error('[Database] Connection could not be established.')
			console.error(JSON.stringify(err))
			console.info('Shutting down...')
			process.exit()
		})

	mailer.checkConnections()
})
