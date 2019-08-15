'use strict'

require('dotenv').load()
const app = require('express')()
const Sequelize = require('sequelize')
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const Promise = require('bluebird')
const logger = require('./util/logger')
const morgan = require('morgan')
const { asyncMiddleware } = require('./util/util')
const { initializeControllers, initializeUser } = require('./util/middleware')
const { AuthenticationError, AuthorizationError, NotFoundError } = require('./classes/errors')
const { MethodNotAllowedError, ValidationError, RequestError, ServerError } = require('./classes/errors')

app.set('trust proxy', true)

app.use(logger.initialize)
app.use((req, res, next) => {
	logger.attachRequestId()
	next()
})

// Enable time-manipulation for testing purposes
app.use((req, res, next) => {
	if (process.env.NODE_ENV === 'test') {
		const tk = require('timekeeper')
		tk.reset()
		if (process.env.TIME !== '') {
			const simulatedTime = process.env.TIME
			const newSystemTime = new Date()

			newSystemTime.setUTCHours(simulatedTime.split(':')[0])
			newSystemTime.setUTCMinutes(simulatedTime.split(':')[1])
			newSystemTime.setUTCSeconds(simulatedTime.split(':')[2])

			if (process.env.DATE !== '') {
				const simulatedDate = process.env.DATE
				newSystemTime.setUTCDate(simulatedDate.split('.')[0])
				newSystemTime.setUTCMonth(Number(simulatedDate.split('.')[1]) - 1)
				newSystemTime.setUTCFullYear(simulatedDate.split('.')[2])
			}

			tk.freeze(newSystemTime)
		}
	}
	next()
})

app.use(cors())
app.use(helmet())

app.use(morgan('short', {
	stream: {
		write: (str) => {
			logger.info(str.trim())
		}
	}
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: false
}))

app.get('/utc-system-time', (req, res, next) => {
	if (process.env.NODE_ENV === 'test') {
		const systemTime = new Date()
		res.send({
			year: systemTime.getFullYear(),
			month: systemTime.getUTCMonth(),
			day: systemTime.getUTCDate(),
			hour: systemTime.getUTCHours(),
			minute: systemTime.getUTCMinutes(),
			second: systemTime.getUTCSeconds()
		})
	} else {
		next()
	}
})

app.get('/api', (req, res) => {
	res.send({
		message: 'This is the mampfalot-api! Please authenticate yourself for data access.'
	})
})

// Router
const router = {
	authenticate: require('./router/authenticate'),
	groups: require('./router/groups'),
	users: require('./router/users')
}

app.use('/api/authenticate', router.authenticate)
app.use('/api/users', router.users)
app.use('/api/groups', [asyncMiddleware(initializeUser), initializeControllers], router.groups)

// Handle request errors
app.use((err, req, res, next) => {
	if (err instanceof RequestError) {
		logger.warn({ error: err }, 'RequestError')
		res.status(400).send(err)
	} else {
		next(err)
	}
})

// Handle authentication errors
app.use((err, req, res, next) => {
	if (err instanceof AuthenticationError) {
		logger.warn({ error: err }, 'AuthenticationError')
		res.status(401).send(err)
	} else {
		next(err)
	}
})

// Handle authorization errors
app.use((err, req, res, next) => {
	if (err instanceof AuthorizationError) {
		logger.warn({ error: err }, 'AuthorizationError')
		res.status(403).send(err)
	} else {
		next(err)
	}
})

// Handle not found errors
app.use((err, req, res, next) => {
	if (err instanceof NotFoundError) {
		logger.warn({ error: err }, 'NotFoundError')
		res.status(404).send(err)
	} else {
		next(err)
	}
})

// Handle MethodNotAllowedErrors
app.use((err, req, res, next) => {
	if (err instanceof MethodNotAllowedError) {
		logger.warn({ error: err }, 'MethodNotAllowedError')
		res.status(405).send(err)
	} else {
		next(err)
	}
})

// Convert Sequelize validation errors
app.use((err, req, res, next) => {
	if (err instanceof Sequelize.ValidationError) {
		const validationError = new ValidationError()
		validationError.fromSequelizeValidationError(err)
		err = validationError
	}
	next(err)
})

// Convert Sequelize BulkRecordError
app.use((err, req, res, next) => {
	if (err instanceof Promise.AggregateError) {
		const bulkRecordError = err[0]

		const validationError = new ValidationError()
		validationError.fromBulkRecordError(bulkRecordError)
		err = validationError
	}

	next(err)
})

// Handle custom validation errors
app.use((err, req, res, next) => {
	if (err instanceof ValidationError) {
		res.status(400).send(err)
		logger.warn({ error: err }, 'ValidationError')
	} else {
		next(err)
	}
})

// Handle foreign key errors
app.use((err, req, res, next) => {
	if (err instanceof Sequelize.ForeignKeyConstraintError) {
		res.status(400).send(err)
		logger.warn({ error: err }, 'ForeignConstraintError')
	} else {
		next(err)
	}
})

// Handle database errors
app.use((err, req, res, next) => {
	if (err instanceof Sequelize.DatabaseError) {
		logger.error({ error: err }, 'DatabaseError')
		res.status(500).send(new ServerError())
	} else {
		next(err)
	}
})

// Handle every other possible error
app.use((err, req, res, next) => {
	// Log to err instead error to get serialized by pino
	logger.error({ err: err }, 'Unexpected Error')
	res.status(500).send(new ServerError())
})

app.use((req, res, next) => {
	const err = {
		type: 'NotFoundError',
		message: 'This route could not be found.'
	}
	logger.warn({ error: err }, 'Request to unknown route')
	res.status(404).send(err)
})

module.exports = app
