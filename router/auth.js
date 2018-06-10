const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('./../models').User
const auth = require('./../util/auth')

router.route('/').get((req, res) => {
	let credentials
	try {
		credentials = auth.decodeBasicAuthorizationHeader(req)
	} catch (error) {
		res.status(400).send({
			error
		})
		return
	}

	User.unscoped().findOne({
			where: {
				email: credentials.email
			},
			raw: true
		})
		.then(user => {
			if (!user) {
				res.status(400).send({
					error: 'Invalid Credentials'
				})
				return
			}

			// Ein User wurde gefunden, vergleiche das Passwort
			if (bcrypt.compareSync(credentials.password, user.password)) {
				// Passwort korrekt - generiere Token
				tokenData = user

				// Nicht benötigte User-Daten entfernen
				tokenData.createdAt = undefined
				tokenData.updatedAt = undefined

				let token = jwt.sign(tokenData, process.env.SECRET_KEY, {
					expiresIn: '10h'
				})
				res.send({
					token
				})
			} else {
				// Password inkorrekt
				res.status(401).send({
					error: 'Invalid Credentials'
				})
			}
		})
		.catch(error => {
			res.status(500).send(error)
		})
})

module.exports = router