const { createServer } = require('../../src/server')

let server = null

module.exports = {
	async start(port = 5001, time = '', date = '') {
		process.env.TIME = time
		process.env.DATE = date

		await this.stop()
		server = await createServer(port)

		await server.start()
	},
	async stop() {
		if (server !== null) {
			await server.stop()
		}
	}
}
