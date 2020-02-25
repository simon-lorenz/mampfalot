const { AuthorizationError, AuthenticationError, RequestError, NotFoundError } = require('../util/errors')
const ResourceLoader = require('../util/resource-loader')
const { User } = require('../models')
const bcrypt = require('bcryptjs')
const mailer = require('../util/mailer')
const { generateRandomToken } = require('../util/util')
const { Op } = require('sequelize')

class UserController {
	constructor(user) {
		this.user = user
	}

	async getUser(userId) {
		if (userId !== this.user.id) {
			throw new AuthorizationError('User', userId, 'READ')
		}

		return await ResourceLoader.loadUserWithEmail(userId)
	}

	static async createUser(values) {
		// Is this email already known?W
		const existingUser = await User.findOne({
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

			return
		}

		const verificationToken = await generateRandomToken(25)

		const user = await User.build({
			username: values.username,
			firstName: values.firstName,
			lastName: values.lastName,
			email: values.email,
			password: values.password,
			verificationToken: await bcrypt.hash(verificationToken, process.env.NODE_ENV === 'test' ? 1 : 12)
		})

		await user.validate()

		user.password = await bcrypt.hash(user.password, 12)
		await user.save()

		await mailer.sendWelcomeMail(user.email, user.username, verificationToken, user.firstName)
	}

	async deleteUser(userId) {
		if (userId !== this.user.id) {
			throw new AuthorizationError('User', userId, 'DELETE')
		}

		await User.destroy({ where: { id: userId } })
	}

	async updateUser(userId, values) {
		if (userId !== this.user.id) {
			throw new AuthorizationError('User', userId, 'UPDATE')
		}

		const userResource = await User.findOne({
			where: {
				id: userId
			}
		})

		if (values.password) {
			if (!values.currentPassword) {
				throw new RequestError('You need to provide your current password to change it.')
			}

			if ((await this.checkPassword(userResource.username, values.currentPassword)) === false) {
				throw new AuthenticationError('The provided credentials are incorrect.')
			} else {
				userResource.password = bcrypt.hashSync(values.password, 12)
			}
		}

		if (values.username) {
			userResource.username = values.username
		}

		if (values.firstName === '' || values.firstName === null) {
			userResource.firstName = null
		} else if (values.firstName) {
			userResource.firstName = values.firstName.trim()
		}

		if (values.lastName === '' || values.lastName === null) {
			userResource.lastName = null
		} else if (values.lastName) {
			userResource.lastName = values.lastName.trim()
		}

		userResource.email = values.email.trim()

		await userResource.save()
		return await ResourceLoader.loadUserWithEmail(userId)
	}

	static async initializeVerificationProcess(username) {
		const user = await User.findOne({
			attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'verificationToken', 'verified'],
			where: {
				username: username
			}
		})

		if (!user) {
			throw new NotFoundError('User', username)
		}

		if (user.verified) {
			throw new RequestError('This user is already verified.')
		}

		const verificationToken = await generateRandomToken(25)

		user.verificationToken = await bcrypt.hash(verificationToken, 12)

		await user.save()
		await mailer.sendWelcomeMail(user.email, user.username, verificationToken, user.firstName)
	}

	static async finalizeVerificationProcess(username, token) {
		const user = await User.findOne({
			attributes: ['id', 'verificationToken', 'verified'],
			where: {
				username: username
			}
		})

		if (!user) {
			throw new NotFoundError('User', username)
		}

		if (user.verified) {
			throw new RequestError('This user is already verified.')
		}

		if (!user.verificationToken) {
			throw new RequestError('This user needs to request verification first.')
		}

		if ((await bcrypt.compare(token, user.verificationToken)) === false) {
			throw new AuthenticationError('The provided credentials are incorrect.')
		}

		user.verified = true
		user.verificationToken = null

		await user.save()
	}

	static async initializePasswordResetProcess(username) {
		const user = await User.findOne({ where: { username } })

		if (!user) {
			throw new NotFoundError('User', username)
		}

		const token = await generateRandomToken(25)
		const tokenExp = new Date()

		tokenExp.setMinutes(tokenExp.getMinutes() + 30)

		user.passwordResetToken = await bcrypt.hash(token, 12)
		user.passwordResetExpiration = tokenExp
		await user.save()

		await mailer.sendPasswordResetMail(user.email, user.username, token, user.firstName)
	}

	static async finalizePasswordResetProcess(username, token, newPassword) {
		const user = await User.unscoped().findOne({
			where: {
				username: username,
				passwordResetExpiration: {
					[Op.gte]: new Date()
				}
			}
		})

		if (!user) {
			throw new NotFoundError('User', username)
		}

		if (!user.passwordResetToken) {
			throw new RequestError('This user needs to request a password reset first.')
		}

		if ((await bcrypt.compare(token, user.passwordResetToken)) === false) {
			throw new AuthenticationError('The provided credentials are incorrect.')
		}

		user.password = newPassword
		user.passwordResetToken = null
		user.passwordResetExpiration = null
		await user.validate()

		user.password = await bcrypt.hash(user.password, 12)
		await user.save()
	}

	static async initializeUsernameReminderProcess(email) {
		const user = await User.findOne({
			attributes: ['email', 'username', 'firstName'],
			where: { email }
		})

		if (user) {
			await mailer.sendForgotUsernameMail(user.email, user.username, user.firstName)
		}
	}

	async checkPassword(username, password) {
		const user = await User.findOne({
			attributes: ['password'],
			where: {
				username: username
			}
		})
		return await bcrypt.compare(password, user.password)
	}
}

module.exports = UserController
