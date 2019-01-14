'use strict'

const app = require('./app')
const PORT = process.env.PORT || 5000
const sequelize = require('./models').sequelize
const Mailer = require('./classes/mailer')
const mailer = new Mailer()

app.listen(PORT, () => {
	console.log(`[Config] Launched in ${process.env.NODE_ENV} mode.`)
	console.log(`[Config] Listening to port ${PORT}`)
	console.log(`[Config] Frontend URL: ${process.env.FRONTEND_BASE_URL}`)
	console.log(`[Database] Trying to connect to "${process.env.DB_NAME}" at ${process.env.DB_HOST} ...`)
	sequelize.authenticate()
		.then(() => console.log('[Database] Connection successfully established.'))
		.catch((err) => {
			console.error('[Database] Connection could not be established.')
			console.error(JSON.stringify(err))
			console.info('Shutting down...')
			process.exit()
		})

	mailer.checkConnections()
})
