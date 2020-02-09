const router = require('express').Router()
const { AuthenticationError } = require('../classes/errors')
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const { extractBasicCredentialsFromHeader, checkCredentialsAndGenerateToken } = require('../util/authentication')

router.route('/').all(allowMethods(['GET']))

router.route('/').get(
	asyncMiddleware(async (req, res, next) => {
		const authorizationHeader = req.headers.authorization

		if (!authorizationHeader) {
			return next(new AuthenticationError('This request requires authentication.'))
		}

		const credentials = extractBasicCredentialsFromHeader(authorizationHeader)
		const token = await checkCredentialsAndGenerateToken(credentials.username, credentials.password)
		res.send({ token })
	})
)

module.exports = router
