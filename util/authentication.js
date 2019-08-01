'use strict'

const { AuthenticationError } = require('../classes/errors')
const { User, Session } = require('../models')
const bcrypt = require('bcryptjs')
const uuidv4 = require('uuid/v4')

/**
 * Decodes a basic authorization header and returns the credentials.
 * @param {string} authorizationHeader
 * @returns {object} An object that contains username and password
 */
function extractBasicCredentialsFromHeader(authorizationHeader) {
	// Header-Structure: 'Basic <base64credentials>'
	// We only care for the credentials.
	const credentialsBase64 = authorizationHeader.split(' ')[1]

	// Decode and get a string like username:password
	const credentials = Buffer.from(credentialsBase64, 'base64').toString('utf-8')
	const splitted = credentials.split(':')

	return {
		username: splitted[0],
		// In case the password contains a colon, the array has been split into more than two parts.
		// We need to make sure to join the password together again.
		password: splitted.slice(1, splitted.length).join(':')
	}
}

/**
 * Throws errors, if the credentials do not match or the user is not verified.
 * @param {string} username
 * @param {string} password
 * @throws {AuthenticationError}
 */
async function checkCredentials(username, password) {
	const user = await User.unscoped().findOne({
		where: {
			username: username
		},
		attributes: ['id', 'username', 'password', 'verified'],
		raw: true
	})

	if (!user)
		throw new AuthenticationError('The provided credentials are incorrect.')

	if (!user.verified)
		throw new AuthenticationError('This account is not verified yet.')

	const passwordMatch = await bcrypt.compare(password, user.password)
	if (!passwordMatch)
		throw new AuthenticationError('The provided credentials are incorrect.')
}

/**
 * Creates a new session token, writes it to the database and returns it.
 * @param {string} username
 * @param {integer} [expiresIn] After which amount of time (in minutes) should this session expire? Default: No Expiration.
 * @returns {string} A uuid/v4 session token
 */
async function initializeSession(username, expiresIn) {
	const user = await User.findOne({
		attributes: ['id'],
		where: {
			username
		}
	})

	// TODO: Expiry

	const session = await Session.create({
		userId: user.id,
		token: uuidv4()
	})
	return session.token
}

/**
 * Checks if the session id is still valid and returns the associated userId.
	* @param {*} req
	* @returns {number} userId
	* @throws {AuthenticationError}
	*/
async function verifySession(req, res) {
	if (!req.cookies.session)
		throw new AuthenticationError('This request requires authentication.')

	const session = await Session.findOne({
		attributes: ['userId'],
		where: {
			token: req.cookies.session
			// TODO: Expiry
		}
	})

	if (session === null) {
		res.clearCookie('session')
		throw new AuthenticationError('The provided session is invalid.')
	}
	else
		return session.userId
}

module.exports = {
	checkCredentials,
	extractBasicCredentialsFromHeader,
	verifySession,
	initializeSession
}
