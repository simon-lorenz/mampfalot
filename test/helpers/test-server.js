'use strict'

const app = require('../../app')

class TestServer {

	start(port, time = '') {
		process.env.TIME = time
		this.server = app.listen(port)
	}

	close() {
		if (this.server) {
			this.server.close()
		}
	}

}

const testServer = new TestServer()

module.exports = testServer
