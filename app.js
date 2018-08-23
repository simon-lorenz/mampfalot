require('./config')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const helmet = require('helmet')
const authMiddleware = require('./middleware/auth')
const commonMiddleware = require('./middleware/common')
const Sequelize = require('sequelize')

app.use(cors())
app.use(helmet())

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
	foodTypes: require('./router/foodTypes'),
	users: require('./router/users'),
	votes: require('./router/votes'),
	lunchbreaks: require('./router/lunchbreaks'),
	participants: require('./router/participants'),
	comments: require('./router/comments')
}

app.use('/api/auth', router.auth)
app.use('/api/users', router.users)

app.use('/api/groups', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.groups)
app.use('/api/places', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.places)
app.use('/api/foodTypes', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.foodTypes)
app.use('/api/votes', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.votes)
app.use('/api/lunchbreaks', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.lunchbreaks)
app.use('/api/participants', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.participants)
app.use('/api/comments', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.comments)

// Handle Sequelize Errors
app.use((err, req, res, next) => {
	if (err instanceof Sequelize.ValidationError) {
		res.status(400).send(err)
	} else if (err instanceof Sequelize.ForeignKeyConstraintError) {
		res.status(400).send(err)
	} else if (err instanceof Sequelize.DatabaseError) {
		res.status(400).send(err)
	} else {
		console.log(err)
		res.status(500).send('500: Internal server error')
	}
})

module.exports = app