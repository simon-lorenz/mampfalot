const router = require('express').Router()
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { Op } = require('sequelize')
const { User, Group } = require('../models')
const { allowMethods, hasQueryValues, initUser, hasBodyValues, verifyToken } = require('../util/middleware')
const { AuthenticationError, NotFoundError, RequestError } = require('../classes/errors')
const { asyncMiddleware }  = require('../util/util')
const Mailer = require('../classes/mailer')
const mailer = new Mailer

router.route('/').all(allowMethods(['GET', 'POST']))
router.route('/').get(hasQueryValues(['email'], 'all'))
router.route('/verify').all(allowMethods(['GET', 'POST']))
router.route('/verify').get(hasQueryValues(['email'], 'all'))
router.route('/verify').post(hasBodyValues(['userId', 'verificationToken'], 'all'))
router.route('/password-reset').all(allowMethods(['GET', 'POST']))
router.route('/password-reset').get(hasQueryValues(['email'], 'all'))
router.route('/password-reset').post(hasBodyValues(['userId', 'resetToken', 'newPassword'], 'all'))

router.route('/').get(asyncMiddleware(async (req, res, next) => {
	let user = await User.findOne({ where: { email: req.query.email }})
	if (user) {
		res.send(user)
	} else {
		return next(new NotFoundError('User', null))
	}
}))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	let verificationToken = await new Promise((resolve, reject) => {
		crypto.randomBytes(25, (err, buff) => {
			if (err) reject(err)
			resolve(buff.toString('hex'))
		})
	})

	let user = await User.create({
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		password: req.body.password,
		verificationToken: await bcrypt.hash(verificationToken, 12)
	})

	user.password = undefined
	user.passwordResetToken = undefined
	user.passwordResetExpiration = undefined
	user.verificationToken = undefined

	if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
		await mailer.sendWelcomeMail(user.email, user.firstName, user.id, verificationToken)
	}

	res.send(user)
}))

router.route('/verify').get(asyncMiddleware(async (req, res, next) => {
	let { email } = req.query
	let user = await User.findOne({
		attributes: ['id', 'name', 'email', 'verificationToken', 'verified'],
		where: {
			email: email
		}
	})

	if (!user) return res.status(204).send()
	if (user.verified) return next(new RequestError('This user is already verified.'))

	let verificationToken = await new Promise((resolve, reject) => {
		crypto.randomBytes(25, (err, buff) => {
			if (err) reject(err)
			resolve(buff.toString('hex'))
		})
	})

	user.verificationToken = await bcrypt.hash(verificationToken, 12)
	await user.save()

	if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
		await mailer.sendWelcomeMail(user.email, user.firstName, user.id, verificationToken)
	}

	res.status(204).send()
}))

router.route('/verify').post(asyncMiddleware(async (req, res, next) => {
	let { userId, verificationToken } = req.body

	let user = await User.findOne({
		attributes: ['id', 'verificationToken', 'verified'],
		where: {
			id: userId
		}
	})

	if (!user) return res.status(204).send()
	if (user.verified) return next(new RequestError('This user is already verified.'))

	if (await bcrypt.compare(verificationToken, user.verificationToken) === false) {
		return next(new AuthenticationError('The provided credentials are incorrect.'))
	}

	user.verified = true;
	await user.save()
	res.status(204).send()
}))

router.route('/password-reset').get(asyncMiddleware(async (req, res, next) => {
	let { email } = req.query

	let user = await User.findOne({ where: { email }})

	if (!user) return res.status(204).send()

	// Generate a random token
	let token = await new Promise((resolve, reject) => {
		crypto.randomBytes(25, (err, buff) => {
			if (err) return reject(err)
			resolve(buff.toString('hex'))
		})
	})

	let tokenExp = new Date()
	tokenExp.setMinutes(tokenExp.getMinutes() + 30)

	user.passwordResetToken = await bcrypt.hash(token, 12)
	user.passwordResetExpiration = tokenExp
	await user.save()

	if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'production') {
		await mailer.sendPasswordResetMail(user.email, user.firstName, user.id, token)
	}

	res.status(204).send()
}))

router.route('/password-reset').post(asyncMiddleware(async (req, res, next) => {
	let { userId, resetToken, newPassword } = req.body

	let user = await User.unscoped().findOne({
		where: {
			id: userId,
			passwordResetExpiration: {
				[Op.gte]: new Date()
			}
		}
	})

	if (!user) return next(new AuthenticationError('The provided credentials are incorrect.'))

	if (await bcrypt.compare(resetToken, user.passwordResetToken) === false) {
		return next(new AuthenticationError('The provided credentials are incorrect.'))
	}

	user.password = newPassword
	user.passwordResetToken = null
	user.passwordResetExpiration = null
	await user.save()

	res.status(204).send()
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
	userResource.passwordResetToken = undefined
	userResource.passwordResetExpiration = undefined
	userResource.verificationToken = undefined
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

	if (req.body.firstName) { userResource.firstName = req.body.firstName.trim() }
	if (req.body.lastName) { userResource.lastName = req.body.lastName.trim() }
	if (req.body.email) { userResource.email = req.body.email.trim() }
	if (req.body.password) { userResource.password = req.body.password }

	await user.can.updateUser(userResource)
	await userResource.save()
	userResource.password = undefined
	userResource.passwordResetToken = undefined
	userResource.passwordResetExpiration = undefined
	userResource.verificationToken = undefined
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
