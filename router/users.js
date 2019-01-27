'use strict'

const router = require('express').Router()
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')
const { User, Group, Place, Lunchbreak, GroupMembers, Invitation } = require('../models')
const { allowMethods, hasQueryValues, initUser, hasBodyValues, verifyToken } = require('../util/middleware')
const { AuthenticationError, NotFoundError, RequestError } = require('../classes/errors')
const { asyncMiddleware, generateRandomToken }  = require('../util/util')
const Mailer = require('../classes/mailer')
const mailer = new Mailer()
const loader = require('../classes/resource-loader')

router.route('/').all(allowMethods(['GET', 'POST']))
router.route('/').get(hasQueryValues(['username'], 'all'))
router.route('/').post(hasBodyValues(['username', 'email', 'password'], 'all'))
router.route('/verify').all(allowMethods(['GET', 'POST']))
router.route('/verify').get(hasQueryValues(['username'], 'all'))
router.route('/verify').post(hasBodyValues(['username', 'token'], 'all'))
router.route('/password-reset').all(allowMethods(['GET', 'POST']))
router.route('/password-reset').get(hasQueryValues(['username'], 'all'))
router.route('/password-reset').post(hasBodyValues(['username', 'token', 'newPassword'], 'all'))
router.route('/forgot-username').all(allowMethods(['GET']))
router.route('/forgot-username').get(hasQueryValues(['email'], 'all'))

router.route('/').get(asyncMiddleware(async (req, res, next) => {
	const { username } = req.query
	const user = await User.findOne({ where: { username: username } })
	if (user) {
		res.send({
			id: user.id,
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			verified: user.verified,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		})
	} else {
		return next(new NotFoundError('User', username))
	}
}))

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

router.route('/verify').get(asyncMiddleware(async (req, res, next) => {
	const { username } = req.query
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

router.route('/verify').post(asyncMiddleware(async (req, res, next) => {
	const { username, token } = req.body

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

router.route('/password-reset').get(asyncMiddleware(async (req, res, next) => {
	const { username } = req.query

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

router.route('/password-reset').post(asyncMiddleware(async (req, res, next) => {
	const { username, token, newPassword } = req.body

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

router.route('/forgot-username').get(async (req, res, next) => {
	const { email } = req.query

	const user = await User.findOne({
		attributes: ['email', 'username', 'firstName'],
		where: { email }
	})

	if (user) {
		await mailer.sendForgotUsernameMail(user.email, user.username, user.firstName)
	}

	res.status(204).send()
})
router.use([verifyToken, initUser])

router.route('/:userId').all(allowMethods(['GET', 'POST', 'DELETE']))
router.route('/:userId').post(hasBodyValues(['username', 'firstName', 'lastName', 'email', 'password'], 'atLeastOne'))
router.route('/:userId/groups').all(allowMethods(['GET']))
router.route('/:userId/invitations').all(allowMethods(['GET', 'DELETE']))
router.route('/:userId/invitations').delete(hasQueryValues(['groupId', 'accept'], 'all'))

router.param('userId', asyncMiddleware(loader.loadUser))

router.route('/:userId').get(asyncMiddleware(async (req, res, next) => {
	const user = res.locals.user
	const userResource = res.locals.resources.user
	await user.can.readUser(userResource)
	userResource.password = undefined
	userResource.passwordResetToken = undefined
	userResource.passwordResetExpiration = undefined
	userResource.verificationToken = undefined
	res.send(userResource)
}))

router.route('/:userId').post(asyncMiddleware(async (req, res, next) => {
	const user = res.locals.user
	const userResource = res.locals.resources.user

	if (req.body.password) {
		if (!req.body.currentPassword) {
			return next(new RequestError('You need to provide your current password to change it.'))
		}

		if (await bcrypt.compare(req.body.currentPassword, userResource.password) === false) {
			return next(new AuthenticationError('The provided credentials are incorrect.'))
		}
	}

	if (req.body.username) { userResource.username = req.body.username }
	if (req.body.firstName || req.body.firstName === '') { userResource.firstName = req.body.firstName.trim() }
	if (req.body.lastName || req.body.lastName === '') { userResource.lastName = req.body.lastName.trim() }
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
	const user = res.locals.user
	const userResource = res.locals.resources.user

	await user.can.deleteUser(userResource)
	await userResource.destroy()
	res.status(204).send()
}))

router.route('/:userId/groups').get(asyncMiddleware(async (req, res, next) => {
	const user = res.locals.user
	const userResource = res.locals.resources.user

	await user.can.readGroupCollection(userResource)

	// The problem here is to find all groups of which our user is a member of and
	// get a result which still includes all group members and not only our user.
	// I will do this in two steps, since I don't know how to get this done with
	// one sql statement alone. If there is a simple solution, please tell me.

	// 1. Get all ids of groups the user is a member of
	let memberships = await GroupMembers.findAll({
		attributes: [ 'groupId' ],
		where: {
			userId: userResource.id
		}
	})

	memberships = memberships.map(membership => membership.groupId)

	// 2. Get all groups with those ids
	res.send(await Group.findAll({
		where: {
			id: {
				[Op.in]: memberships
			}
		},
		include: [
			Place,
			Lunchbreak,
			{
				model: User,
				attributes: ['id', 'username', 'firstName', 'lastName'],
				as: 'members',
				through: {
					as: 'config',
					attributes: ['color', 'isAdmin']
				}
			},
			{
				model: Invitation,
				attributes: ['groupId'],
				include: [
					{
						model: User,
						as: 'from',
						attributes: ['id', 'username', 'firstName', 'lastName']
					},
					{
						model: User,
						as: 'to',
						attributes: ['id', 'username', 'firstName', 'lastName']
					}
				]
			}
		]
	}))
}))

router.route('/:userId/invitations').get(asyncMiddleware(async (req, res, next) => {
	const { user } = res.locals
	const userResource = res.locals.resources.user
	await user.can.readInvitationCollectionOfUser(userResource)

	const invitations = await Invitation.findAll({
		attributes: [],
		where: {
			toId: user.id
		},
		include: [
			{
				model: Group,
				attributes: ['id', 'name']
			},
			{
				model: User,
				as: 'from',
				attributes: ['id', 'username', 'firstName', 'lastName']
			},
			{
				model: User,
				as: 'to',
				attributes: ['id', 'username', 'firstName', 'lastName']
			}
		]
	})

	res.send(invitations)
}))

router.route('/:userId/invitations').delete(asyncMiddleware(async (req, res, next) => {
	const { user } = res.locals
	const userResource = res.locals.resources.user
	const groupId = Number(req.query.groupId)
	const accept = req.query.accept == 'true'

	const invitation = await Invitation.findOne({
		where: {
			toId: userResource.id,
			groupId: groupId
		}
	})

	if (!invitation) throw new NotFoundError('Invitation', null)

	await user.can.deleteInvitation(invitation)

	if (accept) {
		await GroupMembers.create({
			groupId: groupId,
			userId: userResource.id,
			isAdmin: false
		})
	}

	await invitation.destroy()
	res.status(204).send()
}))

module.exports = router
