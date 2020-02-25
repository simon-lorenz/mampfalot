const { RequestError, MethodNotAllowedError } = require('../classes/errors')
const { getUser } = require('./user')
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
				if (req.body[value] === undefined) {
					missing.push(value)
				}
			}

			switch (mode) {
				case 'all':
					if (missing.length > 0) {
						const msg = `This request has to provide all of the following body values: ${values.join(', ')}`
						return next(new RequestError(msg))
					} else {
						return next()
					}

				case 'atLeastOne':
					if (missing.length === values.length) {
						const msg = `This request has to provide at least one of the following body values: ${values.join(', ')}`
						return next(new RequestError(msg))
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
						const msg = `This request has to provide all of the following query values: ${values.join(', ')}`
						return next(new RequestError(msg))
					} else {
						return next()
					}

				case 'atLeastOne':
					if (missing.length === values.length) {
						const msg = `This request has to provide at least one of the following query values: ${values.toString()}`
						return next(new RequestError(msg))
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
	 * Initializes res.locals.controllers
	 */
	initializeControllers: (req, res, next) => {
		const user = getUser()
		res.locals.controllers = {
			AbsenceController: new AbsenceController(user),
			UserController: new UserController(user),
			CommentController: new CommentController(user),
			GroupController: new GroupController(user),
			GroupMemberController: new GroupMemberController(user),
			InvitationController: new InvitationController(user),
			LunchbreakController: new LunchbreakController(user),
			ParticipationController: new ParticipationController(user),
			PlaceController: new PlaceController(user)
		}
		next()
	}
}
