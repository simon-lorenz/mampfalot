const cls = require('cls-hooked')
const pino = require('pino')
const uuidv4 = require('uuid/v4')
const morgan = require('morgan')

const logger = pino({
	redact: ['req.headers.authorization'],
	serializers: {
		err: pino.stdSerializers.err
	},
	level: process.env.LOG_LEVEL || 'info'
})

const loggingNamespace = cls.createNamespace('pino-logging')

/**
 * Returns an object with meta data from cls about the current request,
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
	trace(mergingObjectOrMessage, message) {
		if (message) {
			logger.trace({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
		} else {
			logger.trace(getRequestMetaData(), mergingObjectOrMessage)
		}
	},

	debug(mergingObjectOrMessage, message) {
		if (message) {
			logger.debug({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
		} else {
			logger.debug(getRequestMetaData(), mergingObjectOrMessage)
		}
	},

	info(mergingObjectOrMessage, message) {
		if (message) {
			logger.info({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
		} else {
			logger.info(getRequestMetaData(), mergingObjectOrMessage)
		}
	},

	warn(mergingObjectOrMessage, message) {
		if (message) {
			logger.warn({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
		} else {
			logger.warn(getRequestMetaData(), mergingObjectOrMessage)
		}
	},

	error(mergingObjectOrMessage, message) {
		if (message) {
			logger.error({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
		} else {
			logger.error(getRequestMetaData(), mergingObjectOrMessage)
		}
	},

	fatal(mergingObjectOrMessage, message) {
		if (message) {
			logger.fatal({ ...getRequestMetaData(), ...mergingObjectOrMessage }, message)
		} else {
			logger.fatal(getRequestMetaData(), mergingObjectOrMessage)
		}
	},

	/**
	 * Initializing the logger will enable storing meta data like a unique requestId or the requesting users name.
	 */
	initialize(req, res, next) {
		loggingNamespace.bindEmitter(req)
		loggingNamespace.bindEmitter(res)
		loggingNamespace.run(() => next())
	},

	/**
	 * Attaches a unique requestId to each log entry.
	 * Logger needs to be initialized first!
	 */
	attachRequestId() {
		loggingNamespace.set('requestId', uuidv4())
	},

	/**
	 * Attaches the requesting users name to each log enty.
	 * Call this method after successful user authentication.
	 * Logger needs to be initialized first!
	 * @param {string} username
	 */
	attachUsername(username) {
		loggingNamespace.set('username', username)
	},

	/**
	 * Returns a middleware that logs http requests with morgan.
	 * @returns {function} Middleware
	 */
	logHttpRequest() {
		return morgan('short', {
			stream: {
				write: str => {
					this.info(str.trim())
				}
			}
		})
	}
}
