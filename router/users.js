const express = require('express')
const router = express.Router()
const User = require('./../models').User
const Group = require('../models').Group
const authMiddleware = require('./../middleware/auth')
const commonMiddleware = require('./../middleware/common')
const bcrypt = require('bcrypt')

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

router.route('/').get((req, res, next) => {
	let email = req.query.email

	if (!email) {
		res.status(400).send('Please provide an email to search for.')
		return
	}

	User.findOne({
		attributes: {
			exclude: ['password']
		},
		where: {
			email
		}
	})
	.then(user => {
		if (!user) {
			res.status(404).send()
		} else {
			res.send(user)
		}
	})
})

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
	let user = await User.unscoped().findOne({
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
	
	if (req.body.password) {
		if (!(req.body.currentPassword)) {
			res.status(400).send('Please provide the current password')
			return
		}

		if (!bcrypt.compareSync(req.body.currentPassword, user.password)) {
			res.status(401).send('Current password does not match')
			return
		}
	}

	if (req.body.name) { user.name = req.body.name.trim() } 
	if (req.body.email) { user.email = req.body.email.trim() }
	if (req.body.password) { user.password = req.body.password }

	user.save().then(newUser => {
		newUser.password = undefined
		res.send(newUser)
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

router.route('/:userId/groups').get((req, res, next) => {
	if (parseInt(req.params.userId) !== res.locals.user.id) {
		res.status(403).send()
		return
	}

	Group.scope({ method: ['ofUser', res.locals.user]}).findAll()
	.then(groups => {
		res.send(groups)
	})
	.catch(err => {
		next(err)	
	})
})

module.exports = router