const app = require('../../app')

class TestServer {

	start(port, time = '', date = '') {
		this.close()
		process.env.TIME = time
		process.env.DATE = date
		this.server = app.listen(port)
	}

	close() {
		if (this.server)
			this.server.close()
	}

}

const testServer = new TestServer()

module.exports = testServer
