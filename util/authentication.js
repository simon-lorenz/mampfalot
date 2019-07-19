'use strict'

const jwt = require('jsonwebtoken')
const { AuthenticationError } = require('../classes/errors')
const { User } = require('../models')
const bcrypt = require('bcryptjs')

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
 * Returns an access token if the credentials are correct and the user is verified.
 */
async function checkCredentialsAndGenerateToken(username, password) {
	// TODO: Split this function into checkCredentials, checkVerified and generateToken
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

	return jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '10h' })
}

/**
 * Returns the jwt from the authorization header of a request.
 * If the request contains no authorization header, this function will throw an AuthenticationError.
 * @param {string} request
 * @return {string} A jwt
 * @throws  {AuthenticationError}
 */
function getTokenFromAuthorizationHeader(request) {
	const authorizationHeader = request.headers['authorization']
	if (authorizationHeader)
		return authorizationHeader.split(' ')[1]
	else
		throw new AuthenticationError('This request requires authentication.')
}

/**
 * Verifies a jwt and returns the content.
 * @param {string} token A jwt
 * @returns {object}
 */
function verifyToken(token) {
	try {
		return jwt.verify(token, process.env.SECRET_KEY)
	} catch (error) {
		throw new AuthenticationError('The provided token is invalid.')
	}
}

module.exports = {
	checkCredentialsAndGenerateToken,
	getTokenFromAuthorizationHeader,
	extractBasicCredentialsFromHeader,
	verifyToken
}
