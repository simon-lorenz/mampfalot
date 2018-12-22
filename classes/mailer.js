const nodemailer = require('nodemailer')
const handlebars = require('handlebars')
const fs = require('fs')

async function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf-8' }, (err, content) => {
      if (err) reject(err)
      resolve(content)
    })
  })
}

async function compileMail(path, values) {
  const file = await readFile(path)
  const template = handlebars.compile(file)
  return template(values)
}

class Mailer {

	/**
	 * Returns a mail options object to use
	 * with nodemailer
	 * @param {*} email The sender mail address
	 */
	getMailOptions(email) {
		return {
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: true,
			auth: {
				user: email,
				pass: this.getMailAccountPassword(email)
			}
		}
	}

	/**
	 * Returns the password for an email-account
	 * @param {string} email The email account
	 * @throws Exception on unknown email account
	 */
	getMailAccountPassword(email) {
		switch (email) {
			case 'support@mampfalot.app':
				return process.env.MAIL_PASSWORD_SUPPORT
			case 'hello@mampfalot.app':
				return process.env.MAIL_PASSWORD_HELLO
			default:
				throw new Error(`Unkown mail account "${email}"`)
		}
	}

	/**
	 * Tries to establish an smtp connection for a given
	 * e-mail account.Logs the result to the console.
	 * @returns Promise
	 */
	checkConnection(email) {
		const options = this.getMailOptions(email)
		const transport = nodemailer.createTransport(options)
		return transport.verify()
			.then(() => console.log(`[Mailer] Successfully established smtp connection for account ${email}`))
			.catch(() => console.log(`[Mailer] Could not establish smtp connection for account ${email}`))
	}


	/**
	 * Sends a welcome mail which contains a verification link
	 * @param {string} to The users email-address
	 * @param {string} username
	 * @param {string} verificationToken A verification token
	 */
	async sendWelcomeMail(to, username, verificationToken) {
		let transport = nodemailer.createTransport(this.getMailOptions('hello@mampfalot.app'))
		let verificationLink = `${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}`
		let mailOptions = {
			from: '"Mampfalot" <hello@mampfalot.app>',
			to: to,
			subject: 'Willkommen bei Mampfalot!',
			text: await this.getWelcomeText(username, verificationLink),
			html: await this.getWelcomeHTML(username, verificationLink)
		}

		return new Promise((resolve, reject) => {
			transport.sendMail(mailOptions, (err, info) => {
				if (err) return reject(err)
				resolve(info)
			})
		})
	}

	/**
	 * Sends a password reset mail
	 * @param {*} to The user email-address
	 * @param {*} username
	 * @param {*} token A password reset token
	 */
	async sendPasswordResetMail(to, username, token) {
		let transport = nodemailer.createTransport(this.getMailOptions('support@mampfalot.app'))

		let resetLink = `${process.env.FRONTEND_BASE_URL}/confirm-password-reset?token=${token}&user=${username}`

		let mailOptions = {
			from: '"Mampfalot Support" <support@mampfalot.app>',
			to: to,
			subject: 'Dein neues Passwort für Mampfalot',
			text: await this.getPasswordResetText(username, resetLink),
			html: await this.getPasswordResetHTML(username, resetLink)
		}

		return new Promise((resolve, reject) => {
			transport.sendMail(mailOptions, (err, info) => {
					if (err) return reject(err)
					resolve(info)
				})
		})
	}

	async sendUserAlreadyRegisteredMail(to, username) {
		const transport = nodemailer.createTransport(this.getMailOptions('hello@mampfalot.app'))

		const mailOptions = {
			from: '"Mampfalot" <hello@mampfalot.app>',
			to: to,
			subject: 'Willkommen zurück bei Mampfalot!',
			text: await this.getUserAlreadyRegisteredText(username),
			html: await this.getUserAlreadyRegisteredHTML(username)
		}

		return new Promise((resolve, reject) => {
			transport.sendMail(mailOptions, (err, info) => {
					if (err) return reject(err)
					resolve(info)
				})
		})
	}

	async sendUserAlreadyRegisteredButNotVerifiedMail(to, username, verificationToken) {
		const transport = nodemailer.createTransport(this.getMailOptions('hello@mampfalot.app'))

		const mailOptions = {
			from: '"Mampfalot" <hello@mampfalot.app>',
			to: to,
			subject: 'Willkommen zurück bei Mampfalot!',
			text: await this.getUserAlreadyRegisteredButNotVerifiedText(username, verificationToken),
			html: await this.getUserAlreadyRegisteredButNotVerifiedHTML(username, verificationToken)
		}

		return new Promise((resolve, reject) => {
			transport.sendMail(mailOptions, (err, info) => {
					if (err) return reject(err)
					resolve(info)
				})
		})
	}

	async sendForgotUsernameMail(to, username) {
		const transport = nodemailer.createTransport(this.getMailOptions('support@mampfalot.app'))

		const mailOptions = {
			from: '"Mampfalot Support" <support@mampfalot.app>',
			to: to,
			subject: 'Dein Benutzername bei Mampfalot',
			text: await this.getForgotUsernameText(username),
			html: await this.getForgotUsernameHTML(username)
		}

		return new Promise((resolve, reject) => {
			transport.sendMail(mailOptions, (err, info) => {
				if (err) return reject(err)
				resolve(info)
			})
		})
	}

	/**
	 * Returns the html content of a password reset mail
	 * @param {*} username
	 * @param {*} passwordResetLink The password reset link
	 */
	async getPasswordResetHTML(username, passwordResetLink) {
		const filepath = __dirname + '/../mails/forgot-password.html'
		return await compileMail(filepath, { username, passwordResetLink })
	}

	/**
	 * Returns the text content of a password reset mail
	 * @param {*} username
	 * @param {*} passwordResetLink
	 */
	async getPasswordResetText(username, passwordResetLink) {
		const filepath = __dirname + '/../mails/forgot-password.txt'
		return await compileMail(filepath, { username, passwordResetLink })
	}

	/**
	 * Returns the html content of a welcome email
	 * @param {string} username
	 * @param {string} verificationLink A link where the user can verify his email-address
	 */
	async getWelcomeHTML(username, verificationLink) {
		const filepath = __dirname + '/../mails/welcome.html'
		return await compileMail(filepath, { username, verificationLink })
	}

	async getWelcomeText(username, verificationLink) {
		const filepath = __dirname + '/../mails/welcome.txt'
		return await compileMail(filepath, { username, verificationLink })
	}

	async getUserAlreadyRegisteredText(username) {
		const filepath = __dirname + '/../mails/already-registered-verified.txt'
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		return await compileMail(filepath, { passwordResetLink, username })
	}

	async getUserAlreadyRegisteredHTML(username) {
		const filepath = __dirname + '/../mails/already-registered-verified.html'
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		return await compileMail(filepath, { passwordResetLink, username })
	}

	async getUserAlreadyRegisteredButNotVerifiedText(username, verificationToken) {
		const filepath = __dirname + '/../mails/already-registered-unverified.txt'
		const verificationLink = `${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		return await compileMail(filepath, { username, verificationLink, passwordResetLink })
	}

	async getUserAlreadyRegisteredButNotVerifiedHTML(username, verificationToken) {
		const filepath = __dirname + '/../mails/already-registered-unverified.html'
		const verificationLink = `${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		return await compileMail(filepath, { username, verificationLink, passwordResetLink })
	}

	async getForgotUsernameText(username) {
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		return await compileMail(__dirname + '/../mails/forgot-username.txt', { passwordResetLink, username })
	}


	async getForgotUsernameHTML(username) {
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		return await compileMail(__dirname + '/../mails/forgot-username.html', { passwordResetLink, username })
	}
}

module.exports = Mailer
