const jwt = require('jsonwebtoken')

module.exports = {
	verifyToken: function (req, res, next) {
		let authorizationHeader = req.headers['authorization']

		if (!authorizationHeader) {
			res.status(401).send('Missing authorization header.')
			return
		}
		
		const token = authorizationHeader.split(' ')[1]

		jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
			if (err) {
				res.status(401).send('Invalid token')
			} else {
				res.locals.user = decoded // Speichere Userdaten im Request-Objekt
				next()
			}
		})
	},
	decodeBasicAuthorizationHeader: function (request) {
		let header = request.headers['authorization']

		if (!header) {
			throw 'Authorization Header required.'
		}

		// Header-Aufbau: 'Basic <base64String>'
		// Wir wollen nur den b64-String und splitten deshalb beim Leerzeichen
		let credentialsB64 = header.split(' ')[1]
		let credentials = new Buffer(credentialsB64, 'base64').toString('ascii') // Enthält nun email:password

		return {
			email: credentials.split(':')[0],
			password: credentials.split(':')[1]
		}
	}
}