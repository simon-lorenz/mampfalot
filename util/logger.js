'use strict'

const pino = require('pino')
const logger = pino()

logger.level = process.env.LOG_LEVEL || 'info'

module.exports = logger
