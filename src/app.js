require('dotenv').config()
const app = require('express')()
const Sequelize = require('sequelize')
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const Promise = require('bluebird')
const logger = require('./util/logger')
const { asyncMiddleware } = require('./util/util')
const { initializeControllers } = require('./util/middleware')
const { initializeUser } = require('./util/user')
const {
	ValidationError,
	handleAuthenticationError,
	handleAuthorizationError,
	handleNotFoundError,
	handleMethodNotAllowedError,
	handleValidationError,
	handleRequestError,
	handleUnexpectedError
} = require('./util/errors')

app.set('trust proxy', true)

app.use(logger.initialize)
app.use((req, res, next) => {
	logger.attachRequestId()
	next()
})
app.use(logger.logHttpRequest())

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

app.use(bodyParser.json())
app.use(
	bodyParser.urlencoded({
		extended: false
	})
)

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

app.use((req, res, next) => {
	const err = {
		type: 'NotFoundError',
		message: 'This route could not be found.'
	}
	logger.warn({ error: err }, 'Request to unknown route')
	res.status(404).send(err)
})

// Transform sequelize errors
app.use((err, req, res, next) => {
	if (err instanceof Sequelize.ValidationError) {
		next(ValidationError.fromSequelizeValidationError(err))
	} else if (err instanceof Promise.AggregateError) {
		next(ValidationError.fromBulkRecordError(err[0]))
	} else {
		next(err)
	}
})

// Handle errors
app.use(handleAuthenticationError)
app.use(handleAuthorizationError)
app.use(handleMethodNotAllowedError)
app.use(handleNotFoundError)
app.use(handleRequestError)
app.use(handleValidationError)
app.use(handleUnexpectedError)

module.exports = app
