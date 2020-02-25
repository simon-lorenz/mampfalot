const Sequelize = require('sequelize')

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

class ServerError extends Error {
	constructor() {
		super()
		this.type = 'ServerError'
		this.message = 'An internal error occurred.'
	}
}

class ValidationError extends Error {
	constructor(errors = []) {
		super()
		this.type = 'ValidationError'
		this.errors = errors
	}

	fromSequelizeValidationError(error) {
		if (!(error instanceof Sequelize.ValidationError)) {
			throw new Error('the given error was no sequelize validation error')
		}

		this.errors = []
		for (const item of error.errors) {
			this.addError(item.path, item.value, item.message)
		}
	}

	fromBulkRecordError(error) {
		if (!(error instanceof Sequelize.BulkRecordError)) {
			throw new Error('The given error was no BulkRecordError')
		}

		this.fromSequelizeValidationError(error.errors)
	}

	addError(field, value, message) {
		this.errors.push(new ValidationErrorItem(field, value, message))
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
	ServerError,
	ValidationError,
	ValidationErrorItem
}
