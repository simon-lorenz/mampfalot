require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const authMiddleware = require('./middleware/auth')
const commonMiddleware = require('./middleware/common')
const util = require('./util/util')
const PORT = process.env.PORT || 5000

app.use(cors())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
	extended: false
}))

app.get('/', (req, res) => {
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

app.use('/api/*', [authMiddleware.verifyToken, commonMiddleware.loadUser])

app.use('/api/groups', router.groups)
app.use('/api/places', router.places)
app.use('/api/foodTypes', router.foodTypes)
app.use('/api/users', router.users)
app.use('/api/votes', router.votes)
app.use('/api/lunchbreaks', router.lunchbreaks)

// Globaler Exception-Handler
app.use((err, req, res, next) => {
	if (!err) {
		return next()
	} else {
		console.log(err)
		res.status(500).send('500: Internal server error')
	}
})

app.listen(PORT, () => {
	console.log('Listening to port ' + PORT)
})