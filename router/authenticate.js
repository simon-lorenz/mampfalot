'use strict'

const router = require('express').Router()
const { AuthenticationError } = require('../classes/errors')
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const { extractBasicCredentialsFromHeader, checkCredentials, initializeSession } = require('../util/authentication')

router.route('/').all(allowMethods(['GET']))

router.route('/').get(asyncMiddleware(async (req, res, next) => {
	const authorizationHeader = req.headers.authorization

	if (!authorizationHeader)
		return next(new AuthenticationError('This request requires authentication.'))

	const credentials = extractBasicCredentialsFromHeader(authorizationHeader)
	await checkCredentials(credentials.username, credentials.password)
	const session = await initializeSession(credentials.username)

	res.cookie('session', session, {
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true
	}).send()
}))

module.exports = router
