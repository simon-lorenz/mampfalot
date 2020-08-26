const nodemailer = require('nodemailer')
const handlebars = require('handlebars')
const { readFile } = require('../util/util')

const accounts = [
	{
		address: 'support@mampfalot.app',
		from: 'Mampfalot Support <support@mampfalot.app>',
		transport: nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: true,
			auth: {
				user: 'support@mampfalot.app',
				pass: process.env.MAIL_PASSWORD_SUPPORT
			}
		})
	},
	{
		address: 'hello@mampfalot.app',
		from: 'Mampfalot <hello@mampfalot.app>',
		transport: nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: true,
			auth: {
				user: 'hello@mampfalot.app',
				pass: process.env.MAIL_PASSWORD_HELLO
			}
		})
	}
]

/**
 * Compiles a template with handlebars.
 * Please see the template files for required values.
 * @param {string} path
 * @param {object} values
 */
async function compileTemplate(path, values) {
	const file = await readFile(path)
	const template = handlebars.compile(file)
	return template(values)
}

/**
 * Sends an email.
 * This function only sends emails if the app runs in production mode,
 * otherwise the mail gets logged.
 * @param {string} from The mail address from which the mail should be sent
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise}
 */
async function send(from, to, subject, text, html, logger) {
	const account = getAccount(from)

	const mail = {
		from: account.from,
		to,
		subject,
		text,
		html
	}

	if (process.env.NODE_ENV === 'production') {
		return new Promise((resolve, reject) => {
			account.transport.sendMail(mail, (err, info) => {
				logger.info('[Mailer] - Sending email...')
				if (err) {
					return reject(err)
				}

				logger.info('[Mailer] - Mail successfully sent!')
				resolve(info)
			})
		})
	} else if (process.env.NODE_ENV === 'development') {
		logger.info({ email: mail }, 'Would send email in production mode.')
	}
}

/**
 * Searches an email account by its email address.
 * @param {string} address
 * @throws {Error} If the address is unknown
 * @returns {Object}
 */
function getAccount(address) {
	const account = accounts.find(a => a.address === address)

	if (!account) {
		throw new Error(`No account with address "${address}" found!`)
	}

	return account
}

/**
 * With this class you can send a set of different emails to users.
 */
class Mailer {
	constructor(logger) {
		this.logger = logger
		this.templateFolder = `${__dirname}/templates`
	}

	/**
	 * Sends a welcome mail which contains a verification link
	 * @param {string} to The users email-address
	 * @param {string} username
	 * @param {string} verificationToken A verification token
	 * @param {string} firstName Optional. Used for a more personal greeting.
	 */
	async sendWelcomeMail(to, username, verificationToken, firstName) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/welcome.html`
		const fileText = `${this.templateFolder}/welcome.txt`
		const verificationLink = `${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}`
		const greeting = firstName || username

		// Compile templates
		const html = await compileTemplate(fileHtml, { greeting, verificationLink })
		const text = await compileTemplate(fileText, { greeting, verificationLink })

		// Send
		const subject = 'Willkommen bei Mampfalot!'
		await send('hello@mampfalot.app', to, subject, text, html, this.logger)
	}

	/**
	 * Sends a password reset mail
	 * @param {*} to The user email-address
	 * @param {*} username
	 * @param {*} token A password reset token
	 * @param {string} firstName Optional. Used for a more personal greeting.
	 */
	async sendPasswordResetMail(to, username, token, firstName) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/forgot-password.html`
		const fileText = `${this.templateFolder}/forgot-password.txt`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/confirm-password-reset?token=${token}&user=${username}`
		const greeting = firstName || username

		// Compile templates
		const html = await compileTemplate(fileHtml, { greeting, passwordResetLink })
		const text = await compileTemplate(fileText, { greeting, passwordResetLink })

		// Send
		const subject = 'Dein neues Passwort für Mampfalot'
		await send('support@mampfalot.app', to, subject, text, html, this.logger)
	}

	/**
	 * Informs the user that he already has an account with this email address.
	 * @param {string} to
	 * @param {string} username
	 * @param {string} firstName Optional. Used for a more personal greeting.
	 */
	async sendUserAlreadyRegisteredMail(to, username, firstName) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/already-registered-verified.html`
		const fileText = `${this.templateFolder}/already-registered-verified.txt`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		const greeting = firstName || username

		// Compile templates
		const html = await compileTemplate(fileHtml, { username, greeting, passwordResetLink })
		const text = await compileTemplate(fileText, { username, greeting, passwordResetLink })

		// Send
		const subject = 'Willkommen zurück bei Mampfalot!'
		await send('hello@mampfalot.app', to, subject, text, html, this.logger)
	}

	/**
	 * Informs the user that he already has an (unverified) account with this email address.
	 * @param {string} to
	 * @param {string} username
	 * @param {string} verificationToken
	 * @param {string} firstName Optional. Used for a more personal greeting.
	 */
	async sendUserAlreadyRegisteredButNotVerifiedMail(to, username, verificationToken, firstName) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/already-registered-unverified.html`
		const fileText = `${this.templateFolder}/already-registered-unverified.txt`
		const verificationLink = `${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		const greeting = firstName || username

		// Compile templates
		const html = await compileTemplate(fileHtml, { username, greeting, verificationLink, passwordResetLink })
		const text = await compileTemplate(fileText, { username, greeting, verificationLink, passwordResetLink })

		// Send
		const subject = 'Willkommen zurück bei Mampfalot!'
		await send('hello@mampfalot.app', to, subject, text, html, this.logger)
	}

	/**
	 * @param {string} to
	 * @param {string} username
	 * @param {string} firstName Optional. Used for a more personal greeting.
	 */
	async sendForgotUsernameMail(to, username, firstName) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/forgot-username.html`
		const fileText = `${this.templateFolder}/forgot-username.txt`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`
		const greeting = firstName || username

		// Compile templates
		const html = await compileTemplate(fileHtml, { greeting, passwordResetLink, username })
		const text = await compileTemplate(fileText, { greeting, passwordResetLink, username })

		// Send
		const subject = 'Dein Benutzername bei Mampfalot'
		await send('hello@mampfalot.app', to, subject, text, html, this.logger)
	}

	/**
	 * Tries to establish an smtp connection for all accounts.
	 * Logs the result to the console.
	 * @returns {Promise<void>}
	 */
	async checkConnections() {
		for (const account of accounts) {
			try {
				await account.transport.verify()
				this.logger.info(`[Mailer] Successfully established smtp connection for address ${account.address}`)
			} catch (error) {
				this.logger.warn(`[Mailer] Could not establish smtp connection for address ${account.address}`)
			}
		}
	}
}

module.exports = {
	name: 'mailer',
	register: async server => {
		server.ext('onRequest', (request, h) => {
			request.mailer = new Mailer(request.logger)
			return h.continue
		})

		server.decorate('server', 'mailer', new Mailer(server.logger))
	}
}
