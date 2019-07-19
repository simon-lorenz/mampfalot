'use strict'

const jwt = require('jsonwebtoken')
const { AuthenticationError, RequestError, MethodNotAllowedError } = require('../classes/errors')
const User = require('../classes/user')
const CommentController = require('../controllers/comment-controller')
const GroupController = require('../controllers/group-controller')
const GroupMemberController = require('../controllers/group-member-controller')
const InvitationController = require('../controllers/invitation-controller')
const LunchbreakController = require('../controllers/lunchbreak-controller')
const ParticipationController = require('../controllers/participation-controller')
const PlaceController = require('../controllers/place-controller')
const UserController = require('../controllers/user-controller')

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
	/**
	 * Checks if the body of a request has all
	 * required values.
	 * @param req The request
	 * @param values An string array of required values
	 * @param mode Either 'all' or 'atLeastOne'
	 * @throws {RequestError}
	 */
	hasBodyValues(values, mode = 'atLeastOne') {
		return (req, res, next) => {
			const missing = []

			for (const value of values) {
				if (req.body[value] === undefined) {
					missing.push(value)
				}
			}

			switch (mode) {
				case 'all':
					if (missing.length > 0) {
						return  next(new RequestError(`This request has to provide all of the following body values: ${values.join(', ')}`))
					} else {
						return next()
					}

				case 'atLeastOne':
					if (missing.length === values.length) {
						return next(new RequestError(`This request has to provide at least one of the following body values: ${values.join(', ')}`))
					} else {
						return next()
					}

				default:
					return next(new Error('Unkown mode'))
			}
		}
	},

	hasQueryValues(values, mode = 'atLeastOne') {
		return (req, res, next) => {
			const missing = []

			for (const value of values) {
				if (req.query[value] === undefined) {
					missing.push(value)
				}
			}

			switch (mode) {
				case 'all':
					if (missing.length > 0) {
						return  next(new RequestError(`This request has to provide all of the following query values: ${values.join(', ')}`))
					} else {
						return next()
					}

				case 'atLeastOne':
					if (missing.length === values.length) {
						return next(new RequestError(`This request has to provide at least one of the following query values: ${values.toString()}`))
					} else {
						return next()
					}

				default:
					return next(new Error('Unkown mode'))
			}
		}
	},

	/**
	 * Checks if a requests method is supported
	 * If it isn't supported, a MethodNotAllowedError is thrown.
	 * @param {string[]} methods All allowed request methods
	 * @throws {MethodNotALlowedError}
	 */
	allowMethods(methods) {
		return (req, res, next) => {
			if (methods.includes(req.method)) {
				next()
			} else {
				next(new MethodNotAllowedError(req.method, methods))
			}
		}
	},

	convertParamToNumber(param) {
		return (req, res, next) => {
			req.params[param] = Number(req.params[param])
			next()
		}
	},

	/**
	 * Verifies the json web token and initializes the user in res.locals
	 */
	async initializeUser(req, res, next) {
		const user = new User()
		const token = getTokenFromAuthorizationHeader(req)
		const payload = verifyToken(token)
		await user.setId(payload.id)
		res.locals.user = user
		next()
	},

	/**
	 * Initializes res.locals.controllers
	 */
	initializeControllers: (req, res, next) => {
		const { user } = res.locals
		res.locals.controllers = {}
		res.locals.controllers.UserController = new UserController(user)
		res.locals.controllers.CommentController = new CommentController(user)
		res.locals.controllers.GroupController = new GroupController(user)
		res.locals.controllers.GroupMemberController = new GroupMemberController(user)
		res.locals.controllers.InvitationController = new InvitationController(user)
		res.locals.controllers.LunchbreakController = new LunchbreakController(user)
		res.locals.controllers.ParticipationController = new ParticipationController(user)
		res.locals.controllers.PlaceController = new PlaceController(user)
		res.locals.controllers.UserController = new UserController(user)
		next()
	}
}
