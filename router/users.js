'use strict'

const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { User } = require('../models')
const { allowMethods, hasQueryValues, hasBodyValues, convertParamToNumber } = require('../util/middleware')
const { AuthenticationError, NotFoundError, RequestError } = require('../classes/errors')
const { asyncMiddleware, generateRandomToken }  = require('../util/util')
const Mailer = require('../classes/mailer')
const mailer = new Mailer()
const user = require('../classes/user')
const UserController = require('../controllers/user-controller')
const GroupController = require('../controllers/group-controller')
const InvitationController = require('../controllers/invitation-controller')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['username', 'email', 'password'], 'all'))
router.route('/:username/verify').all(allowMethods(['GET', 'POST']))
router.route('/:username/verify').post(hasBodyValues(['token'], 'all'))
router.route('/:username/forgot-password').all(allowMethods(['GET', 'POST']))
router.route('/:username/forgot-password').post(hasBodyValues(['token', 'newPassword'], 'all'))
router.route('/:email/forgot-username').all(allowMethods(['GET']))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	// Is this email already known?
	const existingUser = await User.findOne({
		attributes: ['id', 'email', 'username', 'firstName', 'verified'],
		where: {
			email: req.body.email
		}
	})

	if (existingUser) {
		if (existingUser.verified) {
			await mailer.sendUserAlreadyRegisteredMail(existingUser.email, existingUser.username, existingUser.firstName)
		} else {
			// generate a new verification token, because the stored one is hashed
			const verificationToken = await generateRandomToken(25)
			existingUser.verificationToken = await bcrypt.hash(verificationToken, process.env.NODE_ENV === 'test' ? 1 : 12)
			await existingUser.save()

			await mailer.sendUserAlreadyRegisteredButNotVerifiedMail(existingUser.email, existingUser.username, verificationToken, existingUser.firstName)
		}
		return res.status(204).send()
	}

	const verificationToken = await generateRandomToken(25)

	const user = await User.create({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		password: req.body.password,
		verificationToken: await bcrypt.hash(verificationToken, process.env.NODE_ENV === 'test' ? 1 : 12)
	})

	await mailer.sendWelcomeMail(user.email, user.username, verificationToken, user.firstName)

	res.status(204).send()
}))

router.route('/:username/verify').get(asyncMiddleware(async (req, res, next) => {
	const { username } = req.params
	const user = await User.findOne({
		attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'verificationToken', 'verified'],
		where: {
			username: username
		}
	})

	if (!user) return next(new NotFoundError('User', username))
	if (user.verified) return next(new RequestError('This user is already verified.'))

	const verificationToken = await generateRandomToken(25)

	user.verificationToken = await bcrypt.hash(verificationToken, 12)
	await user.save()

	await mailer.sendWelcomeMail(user.email, user.username, verificationToken, user.firstName)

	res.status(204).send()
}))

router.route('/:username/verify').post(asyncMiddleware(async (req, res, next) => {
	const { token } = req.body
	const { username } = req.params

	const user = await User.findOne({
		attributes: ['id', 'verificationToken', 'verified'],
		where: {
			username: username
		}
	})

	if (!user) return next(new NotFoundError('User', username))
	if (user.verified) return next(new RequestError('This user is already verified.'))
	if (!user.verificationToken) return next(new RequestError('This user needs to request verification first.'))

	if (await bcrypt.compare(token, user.verificationToken) === false) {
		return next(new AuthenticationError('The provided credentials are incorrect.'))
	}

	user.verified = true
	user.verificationToken = null
	await user.save()
	res.status(204).send()
}))

router.route('/:username/forgot-password').get(asyncMiddleware(async (req, res, next) => {
	const { username } = req.params

	const user = await User.findOne({ where: { username } })

	if (!user) return next(new NotFoundError('User', username))

	const token = await generateRandomToken(25)

	const tokenExp = new Date()
	tokenExp.setMinutes(tokenExp.getMinutes() + 30)

	user.passwordResetToken = await bcrypt.hash(token, 12)
	user.passwordResetExpiration = tokenExp
	await user.save()

	await mailer.sendPasswordResetMail(user.email, user.username, token, user.firstName)

	res.status(204).send()
}))

router.route('/:username/forgot-password').post(asyncMiddleware(async (req, res, next) => {
	const { token, newPassword } = req.body
	const { username } = req.params

	const user = await User.unscoped().findOne({
		where: {
			username: username,
			passwordResetExpiration: {
				[Op.gte]: new Date()
			}
		}
	})

	if (!user) return next(new NotFoundError('User', username))
	if (!user.passwordResetToken) return next(new RequestError('This user needs to request a password reset first.'))

	if (await bcrypt.compare(token, user.passwordResetToken) === false) {
		return next(new AuthenticationError('The provided credentials are incorrect.'))
	}

	user.password = newPassword
	user.passwordResetToken = null
	user.passwordResetExpiration = null
	await user.save()

	res.status(204).send()
}))

router.route('/:email/forgot-username').get(async (req, res, next) => {
	const { email } = req.params

	const user = await User.findOne({
		attributes: ['email', 'username', 'firstName'],
		where: { email }
	})

	if (user) {
		await mailer.sendForgotUsernameMail(user.email, user.username, user.firstName)
	}

	res.status(204).send()
})

router.use([asyncMiddleware(user.init)])

router.route('/me').all(allowMethods(['GET', 'PUT', 'DELETE']))
router.route('/me').put(hasBodyValues(['username', 'firstName', 'lastName', 'email'], 'all'))
router.route('/me/groups').all(allowMethods(['GET']))
router.route('/me/invitations').all(allowMethods(['GET']))
router.route('/me/invitations/:groupId').all(allowMethods(['DELETE']))
router.route('/me/invitations/:groupId').delete(hasQueryValues(['accept'], 'all'))

router.route('/me').get(asyncMiddleware(async (req, res, next) => {
	res.send(await UserController.getUser(user.id))
}))

router.route('/me').put(asyncMiddleware(async (req, res, next) => {
	res.send(await UserController.updateUser(user.id, req.body))
}))

router.route('/me').delete(asyncMiddleware(async (req, res, next) => {
	await UserController.deleteUser(user.id)
	res.status(204).send()
}))

router.route('/me/groups').get(asyncMiddleware(async (req, res, next) => {
	res.send(await GroupController.getGroupsByUser(user.id))
}))

router.route('/me/invitations').get(asyncMiddleware(async (req, res, next) => {
	res.send(await InvitationController.getInvitationsOfCurrentUser())
}))

router.param('groupId', convertParamToNumber('groupId'))
router.route('/me/invitations/:groupId').delete(asyncMiddleware(async (req, res, next) => {
	const accept = req.query.accept === 'true'
	const { groupId } = req.params

	if (accept)
		await InvitationController.acceptInvitation(user.id, groupId)
	else
		await InvitationController.rejectInvitation(user.id, groupId)

	res.status(204).send()
}))

module.exports = router
