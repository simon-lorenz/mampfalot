const Sequelize = require('sequelize')
const logger = require('./logger')

class AuthenticationError extends Error {
	constructor(message) {
		super()
		this.type = 'AuthenticationError'
		this.message = message
	}
}

class AuthorizationError extends Error {
	constructor(resource = '', id = '', operation = '') {
		super()
		this.type = 'AuthorizationError'
		this.resource = resource
		this.id = id
		this.operation = operation
		this.message = 'You do not have the necessary permissions for this operation.'
	}
}

class MethodNotAllowedError extends Error {
	constructor(method, allowed) {
		super()
		this.type = 'MethodNotAllowedError'
		this.method = method
		this.allowed = allowed
		this.message = 'This method is not allowed for this route.'
	}
}

class NotFoundError extends Error {
	constructor(resource = '', id = '') {
		super()
		this.type = 'NotFoundError'
		this.resource = resource
		this.id = id
		this.message = 'The requested resource could not be found.'
	}
}

class RequestError extends Error {
	constructor(message) {
		super()
		this.type = 'RequestError'
		this.message = message
	}
}

class ValidationError extends Error {
	constructor(errors = []) {
		super()
		this.type = 'ValidationError'
		this.errors = errors
	}

	static fromSequelizeValidationError(error) {
		if (!(error instanceof Sequelize.ValidationError)) {
			throw new Error('the given error was no sequelize validation error')
		}

		const result = new ValidationError()
		result.errors = error.errors.map(item => new ValidationErrorItem(item.path, item.value, item.message))
		return result
	}

	static fromBulkRecordError(error) {
		if (!(error instanceof Sequelize.BulkRecordError)) {
			throw new Error('The given error was no BulkRecordError')
		}

		return ValidationError.fromSequelizeValidationError(error.errors)
	}
}

class ValidationErrorItem {
	constructor(field = '', value = null, message = '') {
		this.field = field
		this.value = value
		this.message = message
	}
}

module.exports = {
	AuthenticationError,
	AuthorizationError,
	MethodNotAllowedError,
	NotFoundError,
	RequestError,
	ValidationError,
	ValidationErrorItem,
	handleAuthenticationError(err, req, res, next) {
		if (err instanceof AuthenticationError) {
			logger.warn({ error: err }, 'AuthenticationError')
			res.status(401).send(err)
		} else {
			next(err)
		}
	},
	handleAuthorizationError(err, req, res, next) {
		if (err instanceof AuthorizationError) {
			logger.warn({ error: err }, 'AuthorizationError')
			res.status(403).send(err)
		} else {
			next(err)
		}
	},
	handleMethodNotAllowedError(err, req, res, next) {
		if (err instanceof MethodNotAllowedError) {
			logger.warn({ error: err }, 'MethodNotAllowedError')
			res.status(405).send(err)
		} else {
			next(err)
		}
	},
	handleNotFoundError(err, req, res, next) {
		if (err instanceof NotFoundError) {
			logger.warn({ error: err }, 'NotFoundError')
			res.status(404).send(err)
		} else {
			next(err)
		}
	},
	handleRequestError(err, req, res, next) {
		if (err instanceof RequestError) {
			logger.warn({ error: err }, 'RequestError')
			res.status(400).send(err)
		} else {
			next(err)
		}
	},
	handleUnexpectedError(err, req, res, next) {
		// Log to err instead error to get serialized by pino
		logger.error({ err: err }, 'Unexpected Error')
		res.status(500).send({ type: 'ServerError', message: 'An internal error occurred.' })
	},
	handleValidationError(err, req, res, next) {
		if (err instanceof ValidationError) {
			res.status(400).send(err)
			logger.warn({ error: err }, 'ValidationError')
		} else {
			next(err)
		}
	}
}
