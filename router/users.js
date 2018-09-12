const router = require('express').Router()
const bcrypt = require('bcrypt')
const { User, Group } = require('../models')
const { allowMethods, hasQueryValues, initUser, hasBodyValues, verifyToken } = require('../util/middleware')
const { AuthenticationError, NotFoundError, RequestError } = require('../classes/errors')
const { asyncMiddleware }  = require('../util/util')

router.route('/').all(allowMethods(['GET', 'POST']))
router.route('/').get(hasQueryValues(['email'], 'all'))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	let user = await User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password
	})
	user.password = undefined
	res.send(user)
}))

router.route('/').get(asyncMiddleware(async (req, res, next) => {
	let user = await User.findOne({ where: { email: req.query.email }})
	if (user) {
		res.send(user)
	} else {
		return next(new NotFoundError('User', null))
	}
}))

router.use([verifyToken, initUser])

router.route('/:userId').all(allowMethods(['GET', 'POST', 'DELETE']))
router.route('/:userId').post(hasBodyValues(['name', 'email', 'password'], 'atLeastOne'))
router.route('/:userId/groups').all(allowMethods(['GET']))

router.route('/:userId*').all(asyncMiddleware(async (req, res, next) => {
	let userId = parseInt(req.params.userId)
	res.locals.resources = {}
	res.locals.resources.user = await User.unscoped().findById(userId)
	if (res.locals.resources.user) {
		return next()
	} else {
		return next(new NotFoundError('User', userId))
	}
}))

router.route('/:userId').get(asyncMiddleware(async (req, res, next) => {
	let user = res.locals.user
	let userResource = res.locals.resources.user
	await user.can.readUser(userResource)
	userResource.password = undefined
	res.send(userResource)
}))

router.route('/:userId').post(asyncMiddleware(async (req, res, next) => {
	let user = res.locals.user
	let userResource = res.locals.resources.user

	if (req.body.password) {
		if (!req.body.currentPassword) {
			return next(new RequestError('You need to provide the current password, if you want to change it.'))
		}

		if (await bcrypt.compare(req.body.currentPassword, userResource.password) === false) {
			return next(new AuthenticationError('The provided credentials are incorrect.'))
		}
	}

	if (req.body.name) { userResource.name = req.body.name.trim() }
	if (req.body.email) { userResource.email = req.body.email.trim() }
	if (req.body.password) { userResource.password = req.body.password }

	await user.can.updateUser(userResource)
	await userResource.save()
	userResource.password = undefined
	res.send(userResource)
}))

router.route('/:userId').delete(asyncMiddleware(async (req, res, next) => {
	let user = res.locals.user
	let userResource = res.locals.resources.user

	await user.can.deleteUser(userResource)
	await userResource.destroy()
	res.status(204).send()
}))

router.route('/:userId/groups').get(asyncMiddleware(async (req, res, next) => {
	let user = res.locals.user
	let userResource = res.locals.resources.user

	await user.can.readGroupCollection(userResource)
	res.send(await Group.scope({ method: ['ofUser', userResource.id] }).findAll())
}))

module.exports = router
