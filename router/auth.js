const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { User } = require('../models')
const { AuthenticationError } = require('../classes/errors')
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')

router.route('/').all(allowMethods(['GET']))

router.route('/').get((req, res, next) => {
	let basicAuth = req.headers.authorization

	if (!basicAuth) return next(new AuthenticationError('This request requires authentication.'))

	// Header-Aufbau: 'Basic <base64String>'
	// Wir wollen nur den b64-String und splitten deshalb beim Leerzeichen
	let credentialsB64 = basicAuth.split(' ')[1]
	let credentials = new Buffer(credentialsB64, 'base64').toString('utf-8') // Enthält nun username:password

	let splitted = credentials.split(':')

	let username = splitted[0]

	// Falls das Passwort Doppelpunkte enthält, wurde das Array öfter als 1x gesplittet
	// Deshalb holen wir uns hier alles hinter der E-Mail und joinen ggf.
	let password = splitted.slice(1, splitted.length).join(':')

	res.locals.credentials = { username, password }
	next()
})
router.route('/').get(asyncMiddleware(async (req, res, next) => {
	let user = await User.unscoped().findOne({
		where: {
			username: res.locals.credentials.username
		},
		attributes: ['id', 'username', 'password'],
		raw: true
	})

	// Prüfe, ob der User vorhanden ist und ob sein Passwort übereinstimmt
	if (user) {
		let passwordMatch = await bcrypt.compare(res.locals.credentials.password, user.password)
		if (!passwordMatch) {
			return next(new AuthenticationError('The provided credentials are incorrect.'))
		}
	} else {
		return next(new AuthenticationError('The provided credentials are incorrect.'))
	}

	// Generiere Token
	let token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: '10h' })

	res.send({ token })
}))

module.exports = router
