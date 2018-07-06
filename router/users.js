const express = require('express')
const router = express.Router()
const User = require('./../models').User
const Sequelize = require('sequelize')
const authMiddleware = require('./../middleware/auth')
const commonMiddleware = require('./../middleware/common')

router.route('/').post((req, res, next) => {
	User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password
	})
	.then(result => {
		result.password = undefined
		res.send(result)
	})
	.catch(err => {
		next(err)
	})
})

router.use([authMiddleware.verifyToken, commonMiddleware.loadUser])

router.route('/:userId').get((req, res, next) => {
	if (req.params.userId != res.locals.user.id) {
		res.status(403).send()
		return
	}
	
	User.findOne({
			where: {
				id: req.params.userId
			}
		})
		.then(result => {
			res.send(result)
		})
		.catch(error => {
			next(error)
		})
})

router.route('/:userId').post(async (req, res, next) => {
	let user = await User.findOne({
		where: {
			id: req.params.userId
		}
	})

	if (!user) {
		res.status(404).send()
		return
	}

	if (user.id !== res.locals.user.id) {
		res.status(403).send()
		return
	}

	if (!(req.body.name || req.body.email || req.body.password)) {
		res.status(400).send('Please provide at least one of the following parameter: name, email, password')
		return
	}

	if (req.body.name) { user.name = req.body.name.trim() } 
	if (req.body.email) { user.email = req.body.email.trim() }
	if (req.body.password) { user.password = req.body.password }

	user.save().then(test => {
		res.send(test)
		return
	})
	.catch(err => {
		next(err)
	})

})

router.route('/:userId').delete(async (req, res, next) => {	
	let user = await User.findOne({
		where: {
			id: req.params.userId
		}
	})

	if (!user) {
		res.status(404).send()
		return
	}

	if (req.params.userId != res.locals.user.id) {
		res.status(403).send()
		return
	}

	User.destroy({
			where: {
				id: req.params.userId
			}
		})
		.then(result => {
			res.status(204).send()
		})
		.catch(error => {
			next(error)
		})
})

module.exports = router