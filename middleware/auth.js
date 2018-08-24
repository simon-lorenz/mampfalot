const jwt = require('jsonwebtoken')
const authUtil = require('./../util/auth')

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
				res.locals.token = decoded
				next()
			}
		})
	},
	basicAuth: function (req, res, next) {
		let basicAuthorizationHeader = req.headers['authorization']

		if (!basicAuthorizationHeader) {
			res.status(401).send('Basic authorization header required!')
			return
		}

		try {
			res.locals.credentials = authUtil.getBasicAuthCredentials(basicAuthorizationHeader)
			next()
		} catch (error) {
			console.log(error)
			res.status(500).send()
		}
	}
}