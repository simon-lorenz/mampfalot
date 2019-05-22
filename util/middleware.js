'use strict'

const { RequestError, MethodNotAllowedError } = require('../classes/errors')

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
	}

}
