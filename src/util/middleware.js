'use strict'

const { RequestError, MethodNotAllowedError } = require('../classes/errors')
const { verifyToken, getTokenFromAuthorizationHeader } = require('./authentication')
const User = require('../classes/user')
const logger = require('./logger')
const AbsenceController = require('../controllers/absence-controller')
const CommentController = require('../controllers/comment-controller')
const GroupController = require('../controllers/group-controller')
const GroupMemberController = require('../controllers/group-member-controller')
const InvitationController = require('../controllers/invitation-controller')
const LunchbreakController = require('../controllers/lunchbreak-controller')
const ParticipationController = require('../controllers/participation-controller')
const PlaceController = require('../controllers/place-controller')
const UserController = require('../controllers/user-controller')

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
				if (req.body[value] === undefined)
					missing.push(value)
			}

			switch (mode) {
				case 'all':
					if (missing.length > 0)
						return next(new RequestError(`This request has to provide all of the following body values: ${values.join(', ')}`))
					else
						return next()

				case 'atLeastOne':
					if (missing.length === values.length)
						return next(new RequestError(`This request has to provide at least one of the following body values: ${values.join(', ')}`))
					else
						return next()

				default:
					return next(new Error('Unkown mode'))
			}
		}
	},

	hasQueryValues(values, mode = 'atLeastOne') {
		return (req, res, next) => {
			const missing = []

			for (const value of values) {
				if (req.query[value] === undefined)
					missing.push(value)
			}

			switch (mode) {
				case 'all':
					if (missing.length > 0)
						return next(new RequestError(`This request has to provide all of the following query values: ${values.join(', ')}`))
					else
						return next()

				case 'atLeastOne':
					if (missing.length === values.length)
						return next(new RequestError(`This request has to provide at least one of the following query values: ${values.toString()}`))
					else
						return next()

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
			if (methods.includes(req.method))
				next()
			else
				next(new MethodNotAllowedError(req.method, methods))
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
		logger.attachUsername(res.locals.user.username)
		next()
	},

	/**
	 * Initializes res.locals.controllers
	 */
	initializeControllers: (req, res, next) => {
		const { user } = res.locals
		res.locals.controllers = {}
		res.locals.controllers.AbsenceController = new AbsenceController(user)
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