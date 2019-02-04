'use strict'

const app = require('../../app')

class TestServer {

	start(port, time = '', date = '') {
		process.env.TIME = time
		process.env.DATE = date
		this.server = app.listen(port)
	}

	restart(port, time = '', date = '') {
		this.close()
		this.start(port, time, date)
	}

	close() {
		if (this.server) {
			this.server.close()
		}
	}

}

const testServer = new TestServer()

module.exports = testServer
