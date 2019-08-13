'use strict'

const cls = require('cls-hooked')
const pino = require('pino')

const logger = pino({
	redact: ['req.headers.authorization'],
	serializers: {
		err: pino.stdSerializers.err
	},
	level: process.env.LOG_LEVEL || 'info'
})

const loggingNamespace = cls.createNamespace('pino-logging')

/**
 * Returns an object with meta data about the current request,
 * containing the request id and the requesters username.
 */
const getRequestMetaData = () => {
	return {
		id: loggingNamespace.get('requestId'),
		user: loggingNamespace.get('username')
	}
}

module.exports = {
	// Wrap up the pino logger api in a totally DRY manner to attach request meta data to each log entry.
	logger: {
		trace(mergingObjectOrMessage, message) {
			if (message)
				logger.trace({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
			else
				logger.trace(getRequestMetaData(), mergingObjectOrMessage)
		},
		debug(mergingObjectOrMessage, message) {
			if (message)
				logger.debug({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
			else
				logger.debug(getRequestMetaData(), mergingObjectOrMessage)
		},
		info(mergingObjectOrMessage, message) {
			if (message)
				logger.info({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
			else
				logger.info(getRequestMetaData(), mergingObjectOrMessage)
		},
		warn(mergingObjectOrMessage, message) {
			if (message)
				logger.warn({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
			else
				logger.warn(getRequestMetaData(), mergingObjectOrMessage)
		},
		error(mergingObjectOrMessage, message) {
			if (message)
				logger.error({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
			else
				logger.error(getRequestMetaData(), mergingObjectOrMessage)
		},
		fatal(mergingObjectOrMessage, message) {
			if (message)
				logger.fatal({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
			else
				logger.fatal(getRequestMetaData(), mergingObjectOrMessage)
		},
	},
	loggingNamespace
}
