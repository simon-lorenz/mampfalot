const bcrypt = require('bcryptjs')
const Boom = require('@hapi/boom')
const UserRepository = require('./user.repository')
const UserModel = require('./user.model')
const { generateRandomToken } = require('../util/util')
const { Op } = require('sequelize')

async function getAuthenticatedUser(request, h) {
	const { id } = request.auth.credentials
	return UserRepository.getUser(id)
}

async function createUser(request, h) {
	const values = request.payload
	const { mailer } = request

	if (await UserRepository.usernameExists(values.username)) {
		throw Boom.badRequest('This username is already taken')
	}

	// Is this email already known?
	const existingUser = await UserModel.findOne({
		attributes: ['id', 'email', 'username', 'firstName', 'verified'],
		where: {
			email: values.email
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

			await mailer.sendUserAlreadyRegisteredButNotVerifiedMail(
				existingUser.email,
				existingUser.username,
				verificationToken,
				existingUser.firstName
			)
		}

		return h.response().code(204)
	}

	const verificationToken = await generateRandomToken(25)

	const user = await UserModel.build({
		username: values.username,
		firstName: values.firstName,
		lastName: values.lastName,
		email: values.email,
		password: values.password,
		verificationToken: await bcrypt.hash(verificationToken, process.env.NODE_ENV === 'test' ? 1 : 12)
	})

	user.password = await bcrypt.hash(user.password, 12)
	await user.save()

	await mailer.sendWelcomeMail(user.email, user.username, verificationToken, user.firstName)

	return h.response().code(204)
}

async function deleteAuthenticatedUser(request, h) {
	const { id } = request.auth.credentials
	await UserModel.destroy({ where: { id } })
	return h.response().code(204)
}

async function updateAuthenticatedUser(request, h) {
	const { id } = request.auth.credentials
	const { payload } = request

	const { username } = await UserModel.findOne({
		attributes: ['username'],
		where: {
			id
		}
	})

	if (payload.password) {
		if ((await checkPassword(username, payload.currentPassword)) === false) {
			throw Boom.unauthorized('The provided credentials are incorrect')
		} else {
			payload.password = bcrypt.hashSync(payload.password, 12)
		}
	}

	await UserModel.update(payload, { where: { id } })

	return await UserRepository.getUser(id)
}

async function initializeVerificationProcess(request, h) {
	const { username } = request.params
	const { mailer } = request

	const user = await UserModel.findOne({
		attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'verificationToken', 'verified'],
		where: {
			username: username
		}
	})

	if (!user) {
		throw Boom.notFound()
	}

	if (user.verified) {
		throw Boom.badRequest('This user is already verified.')
	}

	const verificationToken = await generateRandomToken(25)

	user.verificationToken = await bcrypt.hash(verificationToken, 12)

	await user.save()
	await mailer.sendWelcomeMail(user.email, user.username, verificationToken, user.firstName)

	return h.response().code(204)
}

async function finalizeVerificationProcess(request, h) {
	const { token } = request.payload
	const { username } = request.params

	const user = await UserModel.findOne({
		attributes: ['id', 'verificationToken', 'verified'],
		where: {
			username: username
		}
	})

	if (!user) {
		throw Boom.notFound()
	}

	if (user.verified) {
		throw Boom.badRequest('This user is already verified.')
	}

	if (!user.verificationToken) {
		throw Boom.badRequest('This user needs to request verification first.')
	}

	if ((await bcrypt.compare(token, user.verificationToken)) === false) {
		throw Boom.unauthorized('The provided verification token is incorrect')
	}

	user.verified = true
	user.verificationToken = null

	await user.save()

	return h.response().code(204)
}

async function initializePasswordResetProcess(request, h) {
	const { username } = request.params
	const { mailer } = request

	const user = await UserModel.findOne({ where: { username } })

	if (!user) {
		throw Boom.notFound()
	}

	const token = await generateRandomToken(25)
	const tokenExp = new Date()

	tokenExp.setMinutes(tokenExp.getMinutes() + 30)

	user.passwordResetToken = await bcrypt.hash(token, 12)
	user.passwordResetExpiration = tokenExp
	await user.save()

	await mailer.sendPasswordResetMail(user.email, user.username, token, user.firstName)

	return h.response().code(204)
}

async function finalizePasswordResetProcess(request, h) {
	const { username } = request.params
	const { token, newPassword } = request.payload

	const user = await UserModel.unscoped().findOne({
		where: {
			username: username,
			passwordResetExpiration: {
				[Op.gte]: new Date()
			}
		}
	})

	if (!user) {
		throw Boom.notFound('This user does not exist or needs to request a password reset first')
	}

	if ((await bcrypt.compare(token, user.passwordResetToken)) === false) {
		throw Boom.unauthorized('The provided reset token is incorrect')
	}

	user.password = newPassword
	user.passwordResetToken = null
	user.passwordResetExpiration = null
	user.password = await bcrypt.hash(user.password, 12)

	await user.save()

	return h.response().code(204)
}

async function initializeUsernameReminderProcess(request, h) {
	const { email } = request.params
	const { mailer } = request

	const user = await UserModel.findOne({
		attributes: ['email', 'username', 'firstName'],
		where: { email }
	})

	if (user) {
		await mailer.sendForgotUsernameMail(user.email, user.username, user.firstName)
	}

	return h.response().code(204)
}

async function checkPassword(username, password) {
	const user = await UserModel.findOne({
		attributes: ['password'],
		where: {
			username: username
		}
	})
	return await bcrypt.compare(password, user.password)
}

module.exports = {
	createUser,

	getAuthenticatedUser,
	updateAuthenticatedUser,
	deleteAuthenticatedUser,

	initializeVerificationProcess,
	finalizeVerificationProcess,
	initializePasswordResetProcess,
	finalizePasswordResetProcess,
	initializeUsernameReminderProcess
}
