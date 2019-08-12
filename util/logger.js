'use strict'

const pino = require('pino')
const logger = pino({
	redact: ['req.headers.authorization'],
	serializers: {
		err: pino.stdSerializers.err
	}
})

logger.level = process.env.LOG_LEVEL || 'info'

module.exports = logger
