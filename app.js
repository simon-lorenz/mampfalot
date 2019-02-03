'use strict'

require('dotenv').load()
const app = require('express')()
const Sequelize = require('sequelize')
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const Promise = require('bluebird')
const { initUser, verifyToken } = require('./util/middleware')
const { AuthenticationError, AuthorizationError, NotFoundError } = require('./classes/errors')
const { MethodNotAllowedError, ValidationError, RequestError, ServerError } = require('./classes/errors')

// Enable time-manipulation for testing purposes
app.use((req, res, next) => {
	if (process.env.NODE_ENV === 'test') {
		const tk = require('timekeeper')
		if (process.env.TIME !== '') {
			const tk = require('timekeeper')
			const simulatedTime = process.env.TIME
			const newSystemTime = new Date()

			newSystemTime.setUTCHours(simulatedTime.split(':')[0])
			newSystemTime.setUTCMinutes(simulatedTime.split(':')[1])
			newSystemTime.setUTCSeconds(simulatedTime.split(':')[2])

			tk.freeze(newSystemTime)
		} else {
			tk.reset()
		}
	}
	next()
})

app.use(cors())
app.use(helmet())

if (process.env.NODE_ENV !== 'test') {
	app.use(morgan('common'))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: false
}))

app.get('/api', (req, res) => {
	res.send({
		message: 'This is the mampfalot-api! Please authenticate yourself for data access.'
	})
})

// Router
const router = {
	auth: require('./router/auth'),
	groups: require('./router/groups'),
	places: require('./router/places'),
	users: require('./router/users'),
	votes: require('./router/votes'),
	lunchbreaks: require('./router/lunchbreaks'),
	participants: require('./router/participants'),
	comments: require('./router/comments')
}

app.use('/api/auth', router.auth)
app.use('/api/users', router.users)

app.use('/api/groups', [verifyToken, initUser], router.groups)
app.use('/api/places', [verifyToken, initUser], router.places)
app.use('/api/votes', [verifyToken, initUser], router.votes)
app.use('/api/lunchbreaks', [verifyToken, initUser], router.lunchbreaks)
app.use('/api/participants', [verifyToken, initUser], router.participants)
app.use('/api/comments', [verifyToken, initUser], router.comments)

// Handle request errors
app.use((err, req, res, next) => {
	if (err instanceof RequestError) {
		res.status(400).send(err)
	} else {
		next(err)
	}
})

// Handle authentication errors
app.use((err, req, res, next) => {
	if (err instanceof AuthenticationError) {
		res.status(401).send(err)
	} else {
		next(err)
	}
})

// Handle authorization errors
app.use((err, req, res, next) => {
	if (err instanceof AuthorizationError) {
		res.status(403).send(err)
	} else {
		next(err)
	}
})

// Handle not found errors
app.use((err, req, res, next) => {
	if (err instanceof NotFoundError) {
		res.status(404).send(err)
	} else {
		next(err)
	}
})

// Handle MethodNotAllowedErrors
app.use((err, req, res, next) => {
	if (err instanceof MethodNotAllowedError) {
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
		// console.log(JSON.stringify(err))
	}

	next(err)
})

// Handle custom validation errors
app.use((err, req, res, next) => {
	if (err instanceof ValidationError) {
		res.status(400).send(err)
	} else {
		next(err)
	}
})

// Handle foreign key errors
app.use((err, req, res, next) => {
	if (err instanceof Sequelize.ForeignKeyConstraintError) {
		res.status(400).send(err)
	} else {
		next(err)
	}
})

// Handle database errors
app.use((err, req, res, next) => {
	if (err instanceof Sequelize.DatabaseError) {
		console.error(err.toString())
		res.status(500).send(new ServerError())
	} else {
		next(err)
	}
})

// Handle every other possible error
app.use((err, req, res, next) => {
	console.error(err.toString())
	res.status(500).send(new ServerError())
})

app.use((req, res, next) => {
	const error = {
		type: 'NotFoundError',
		message: 'This route could not be found.'
	}
	res.status(404).send(error)
})

module.exports = app
