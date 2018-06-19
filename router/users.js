const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('./../models').User
const Util = require('./../util/util')

router.route('/').get((req, res) => {
	User.findAll({
			order: [
				['id', 'ASC']
			]
		})
		.then(result => {
			res.send(result)
		})
		.catch(error => {
			res.status(400).send('Ein Fehler ist aufgetreten' + error)
		})
})

router.route('/').post(Util.isAdmin, (req, res) => {
	if (!(req.body.name && req.body.email && req.body.password)) {
		res.status(400).send({
			success: false,
			error: 'Missing Values'
		})
		return
	}

	let name = req.body.name
	let email = req.body.email
	let password = req.body.password

	User.create({
			name: name,
			email: email,
			password: password
		})
		.then(result => {
			res.status(204).send()
		})
		.catch(error => {
			res.send({
				success: false,
				error
			})
		})
})

router.route('/:userId').get((req, res) => {
	User.findOne({
			where: {
				id: req.params.userId
			}
		})
		.then(result => {
			res.send(result)
		})
		.catch(error => {
			res.status(500).send(error)
		})
})

router.route('/:userId').put((req, res) => {
	let userId = req.params.userId

	// Will der User nicht sich selbst updaten, muss er
	// Administrator-Rechte besitzen.
	if (res.locals.user.id != userId && !res.locals.user.isAdmin) {
		res.status(403).send('403: Forbidden')
		return
	}

	let updatedData = {}
	if (req.body.name) {
		updatedData.name = req.body.name.trim()
	}
	if (req.body.email) {
		updatedData.email = req.body.email.trim()
	}
	if (req.body.password) {
		updatedData.password = req.body.password
	}

	if (Object.keys(updatedData).length === 0) {
		res.status(400).send({
			error: 'Request needs to have at least one of the following parameters: name, email or password'
		})
		return
	}

	User.update(
			updatedData, {
				where: {
					id: userId
				}
			})
		.then(result => {
			// Unser User hat seine Daten geändert, jetzt braucht er ein neues JWT
			User.findOne({
					where: {
						id: userId
					},
					raw: true
				})
				.then(user => {
					tokenData = user

					// Nicht benötigte User-Daten entfernen
					tokenData.createdAt = undefined
					tokeData.updatedAt = undefined

					let token = jwt.sign(tokenData, process.env.SECRET_KEY, {
						expiresIn: 4000
					})
					res.send({
						success: true,
						token
					})
				})
				.catch(err => {
					res.status(500).send({
						success: false,
						err: 'uh.oh'
					})
				})
		})
		.catch(error => {
			res.status(500).send({
				success: false,
				error
			})
		})
})

router.route('/:userId').delete(Util.isAdmin, (req, res) => {
	User.destroy({
			where: {
				id: req.params.userId
			}
		})
		.then(result => {
			res.status(204).send()
		})
		.catch(error => {
			console.log(error)
			res.status(500).send('Something went wrong.')
		})
})

module.exports = router