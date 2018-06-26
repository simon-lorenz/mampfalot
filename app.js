require('./config')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const authMiddleware = require('./middleware/auth')
const commonMiddleware = require('./middleware/common')

app.use(cors())

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
	lunchbreaks: require('./router/lunchbreaks')
}

app.use('/api/auth', router.auth)

app.use('/api/groups', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.groups)
app.use('/api/places', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.places)
app.use('/api/foodTypes', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.foodTypes)
app.use('/api/users', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.users)
app.use('/api/votes', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.votes)
app.use('/api/lunchbreaks', [authMiddleware.verifyToken, commonMiddleware.loadUser], router.lunchbreaks)

// Globaler Exception-Handler
app.use((err, req, res, next) => {
	if (!err) {
		return next()
	} else {
		console.log(err)
		res.status(500).send('500: Internal server error')
	}
})

module.exports = app