module.exports = {

	/**
	 * Checks the structure of an authorization error
	 * @param {Object} error The error to check
	 * @param {Object} [item] Throw an error if this item does not exist in the
	 * "errors"-array
	 */
	checkAuthorizationError(error, expected) {
		error.should.have.all.keys(['type', 'resource', 'id', 'operation', 'message'])
		error.type.should.be.equal('AuthorizationError')

		if (typeof expected === 'undefined') { return }

		if (expected.resource) {
			error.resource.should.be.equal(expected.resource)
		}

		if (expected.id) {
			error.id.should.be.equal(expected.id)
		}

		if (expected.operation) {
			error.operation.should.be.equal(expected.operation)
		}

		if (expected.message) {
			error.message.should.be.equal(expected.message)
		} else {
			error.message.should.be.equal('You do not have the necessary permissions for this operation.')
		}
	},

	checkValidationError(error, item) {
		error.should.have.property('type').equal('ValidationError')
		error.should.have.property('errors').which.is.an('array')

		for (let errorItem of error.errors) {
			errorItem.should.have.all.keys(['field', 'value', 'message'])
		}

		if (item && !this.validationErrorItemExists(error, item)) {
			throw new Error('Searched validationErrorItem ' + JSON.stringify(item) + ' was not found in '+ JSON.stringify(error.errors))
		}
	},

	validationErrorItemExists(error, searchedItem) {
		for (let item of error.errors) {
			if (item.field === searchedItem.field && item.value === searchedItem.value && item.message === searchedItem.message) {
				return true
			}
		}
		return false
	},

	checkAuthenticationError(error, type = 'authRequired') {
		error.should.have.all.keys(['type', 'message'])
		error.type.should.be.equal('AuthenticationError')

		switch (type) {
			case 'invalidCredentials':
				error.message.should.be.equal('The provided credentials are incorrect.')
				break
			case 'authRequired':
				error.message.should.be.equal('This request requires authentication.')
				break
			case 'invalidToken':
				error.message.should.be.equal('The provided token is invalid.')
				break
			case 'notVerified':
				error.message.should.be.equal('This account is not verified yet.')
				break
			default:
				throw new Error('Unknown type')
		}
	},

	checkNotFoundError(error, resource, id) {
		error.should.have.all.keys(['type', 'resource', 'id', 'message'])
		error.type.should.be.equal('NotFoundError')
		error.message.should.be.equal('The requested resource could not be found.')

		if (resource) {
			error.resource.should.be.equal(resource)
		}

		if (id) {
			error.id.should.be.equal(id)
		}
	},

	checkMethodNotAllowedError(error, method, allowed) {
		error.should.have.all.keys(['type', 'method', 'allowed', 'message'])
		error.type.should.be.equal('MethodNotAllowedError')
		error.allowed.should.be.an('array')
		error.message.should.be.equal('This method is not allowed for this route.')

		if (method) {
			error.method.should.be.equal(method)
		}

		if (allowed) {
			error.allowed.should.be.deep.equal(allowed)
		}
	},

	checkRequestError(error, message) {
		error.should.have.all.keys(['type', 'message'])
		error.type.should.be.equal('RequestError')

		if (message) {
			error.message.should.be.equal(message)
		}
	}

}
