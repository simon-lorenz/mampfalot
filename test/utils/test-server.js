const tk = require('timekeeper')
const { createServer } = require('../../src/server')

let server = null

module.exports = {
	async start(port = 5001, time = '', date = '') {
		await this.stop()

		server = await createServer(port)

		tk.reset()

		if (time !== '') {
			const simulatedTime = time
			const newSystemTime = new Date()

			newSystemTime.setUTCHours(simulatedTime.split(':')[0])
			newSystemTime.setUTCMinutes(simulatedTime.split(':')[1])
			newSystemTime.setUTCSeconds(simulatedTime.split(':')[2])

			if (date !== '') {
				const simulatedDate = date
				newSystemTime.setUTCDate(simulatedDate.split('.')[0])
				newSystemTime.setUTCMonth(Number(simulatedDate.split('.')[1]) - 1)
				newSystemTime.setUTCFullYear(simulatedDate.split('.')[2])
			}

			tk.freeze(newSystemTime)
		}

		await server.start()
	},
	async stop() {
		if (server !== null) {
			await server.stop()
		}
	}
}
