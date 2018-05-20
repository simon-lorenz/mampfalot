const jwt = require('jsonwebtoken')

module.exports = {
	validateToken: function (req, res, next) {
		let bearerHeader = req.headers['authorization']

		if (bearerHeader) {
			const bearerToken = bearerHeader.split(' ')[1]

			jwt.verify(bearerToken, process.env.SECRET_KEY, (err, decoded) => {
				if (err) {
					res.status(401).send('Invalid token')
				} else {
					req.user = decoded // Speichere Userdaten im Request-Objekt
					next()
				}
			})
		} else {
			res.status(401).send('Invalid token')
		}
	},
	decodeBasicAuthorizationHeader: function (request) {
		let header = request.headers['authorization']

		if (!header) {
			throw 'Authorization Header required.'
		}

		// Header-Aufbau: 'Basic <base64String>'
		// Wir wollen nur den b64-String und splitten deshalb beim Leerzeichen
		let credentialsB64 = header.split(' ')[1]
		let credentials = new Buffer(credentialsB64, 'base64').toString('ascii') // Enthält nun username:password

		return {
			username: credentials.split(':')[0],
			password: credentials.split(':')[1]
		}
	}
}