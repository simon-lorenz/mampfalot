'use strict'

const cls = require('cls-hooked')
const uuidv4 = require('uuid/v4')

// generate a unique value for namespace
const nsid = 'pino-logging'
const ns = cls.createNamespace(nsid)

/**
 * Initializes a request id.
 */
const initializeRequestId = (req, res, next) => {
	ns.bindEmitter(req)
	ns.bindEmitter(res)

	ns.run(() => {
		ns.set('requestId', uuidv4())
		next()
	})
}

/**
 * Returns request tracer id or `undefined` in case if the call is made from an outside CLS context.
 */
const getRequestId = () => ns.get('requestId')

module.exports = {
	initializeRequestId,
	getRequestId
}
