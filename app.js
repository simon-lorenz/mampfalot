const { createServer } = require('./src/server')
const knex = require('./src/knex')

const server = start()

async function start() {
	const server = await createServer(5000)

	server.logger.info('[Application] Initializing...')
	server.logger.info(`[Config] Running in ${process.env.NODE_ENV} mode.`)
	server.logger.info(`[Config] Log Level is: ${process.env.LOG_LEVEL}`)
	server.logger.info(`[Config] Frontend URL: ${process.env.FRONTEND_BASE_URL}`)

	// Check database connection
	const max_tries = 5
	let tries = 1

	while (tries <= max_tries) {
		server.logger.info(`[Database] Trying to connect (${tries}/${max_tries}) ...`)

		try {
			await knex.raw('SELECT 1+1 AS result')
			server.logger.info(`[Database] Connection established!`)
			break
		} catch (error) {
			if (tries === max_tries) {
				server.logger.fatal({ error }, '[Database] Connection could not be established.')
				process.exit(1)
			} else {
				tries++
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}
	}

	// Run migrations
	try {
		server.logger.info('[Database] Running migrations...')
		const migrateResult = await knex.migrate.latest()
		server.logger.info(`[Database] Ran ${migrateResult[1].length} new migrations`)
	} catch (error) {
		server.logger.fatal({ error }, '[Database] Migrations failed.')
		process.exit(1)
	}

	// Warn if mailer has no connection
	server.mailer.checkConnections()

	// Run server
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
