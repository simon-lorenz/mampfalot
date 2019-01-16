'use strict'

const nodemailer = require('nodemailer')
const handlebars = require('handlebars')
const fs = require('fs')

/**
 * Promisifies nodes readFile() function.
 * Files have to be utf-8 encoded.
 * @param {string} path
 */
async function readFile(path) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, { encoding: 'utf-8' }, (err, content) => {
			if (err) reject(err)
			resolve(content)
		})
	})
}

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
 * This class represents a single mail account.
 * Use it to send mails from this account.
 */
class MailAccount {

	/**
	 * @param {string} address The email address of the account
	 * @param {*} title The accounts title, used in the "from" field
	 * @param {*} password
	 */
	constructor (address, title, password) {
		this.address = address
		this.title = title
		this.password = password
		this.transport = nodemailer.createTransport({
			host: process.env.MAIL_HOST,
			port: process.env.MAIL_PORT,
			secure: true,
			auth: {
				user: address,
				pass: password
			}
		})
	}

	/**
	* Tries to establish an smtp connection for this
	* mail account.Logs the result to the console.
	* @returns Promise
	*/
	checkConnection() {
		return this.transport.verify()
			.then(() => console.log(`[Mailer] Successfully established smtp connection for account ${this.address}`))
			.catch(() => console.log(`[Mailer] Could not establish smtp connection for account ${this.address}`))
	}

	/**
	 * Sends an email from this account.
	 * This function only sends emails if the app runs in production mode,
	 * otherwise the mail gets logged.
	 * @param {string} to
	 * @param {string} subject
	 * @param {string} text
	 * @param {string} html
	 * @returns {Promise}
	 */
	send(to, subject, text, html) {
		const mail = {
			from: `"${this.title}" <${this.address}>`,
			to: to,
			subject: subject,
			text: text,
			html: html
		}

		if (process.env.NODE_ENV === 'production') {
			return new Promise((resolve, reject) => {
				this.transport.sendMail(mail, (err, info) => {
					if (err) return reject(err)
					resolve(info)
				})
			})
		} else if (process.env.NODE_ENV !== 'test') {
			console.log('This email would get send if the app would run in production mode:')
			console.log(mail)
		}
	}

}

/**
 * With this class you can send a set of different emails to users.
 */
class Mailer {

	constructor () {
		this.accounts = new Array()
		this.accounts.push(new MailAccount('support@mampfalot.app', 'Mampfalot Support', process.env.MAIL_PASSWORD_SUPPORT))
		this.accounts.push(new MailAccount('hello@mampfalot.app', 'Mampfalot', process.env.MAIL_PASSWORD_HELLO))
		this.templateFolder = `${__dirname}/../mails`
	}

	/**
	 * Checks connections of all known accounts.
	 * Results are logged to the console.
	 */
	checkConnections() {
		for (const account of this.accounts) {
			account.checkConnection()
		}
	}

	/**
	 * Searches an email account by its email address.
	 * @param {string} address
	 * @throws {Error} If the address is unknown
	 * @returns {MailAccount}
	 */
	getAccount(address) {
		for (const account of this.accounts) {
			if (account.address === address) return account
		}
		throw new Error(`No account with address "${address}" found!`)
	}

	/**
	 * Sends a welcome mail which contains a verification link
	 * @param {string} to The users email-address
	 * @param {string} username
	 * @param {string} verificationToken A verification token
	 */
	async sendWelcomeMail(to, username, verificationToken) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/welcome.html`
		const fileText = `${this.templateFolder}/welcome.txt`
		const verificationLink = `${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}`

		// Compile templates
		const html = await compileTemplate(fileHtml, { username, verificationLink })
		const text = await compileTemplate(fileText, { username, verificationLink })

		// Send
		const subject = 'Willkommen bei Mampfalot!'
		this.getAccount('hello@mampfalot.app').send(to, subject, text, html)
	}

	/**
	 * Sends a password reset mail
	 * @param {*} to The user email-address
	 * @param {*} username
	 * @param {*} token A password reset token
	 */
	async sendPasswordResetMail(to, username, token) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/forgot-password.html`
		const fileText = `${this.templateFolder}/forgot-password.txt`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/confirm-password-reset?token=${token}&user=${username}`

		// Compile templates
		const html = await compileTemplate(fileHtml, { username, passwordResetLink })
		const text = await compileTemplate(fileText, { username, passwordResetLink })

		// Send
		const subject = 'Dein neues Passwort für Mampfalot'
		this.getAccount('support@mampfalot.app').send(to, subject, text, html)
	}

	async sendUserAlreadyRegisteredMail(to, username) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/already-registered-verified.html`
		const fileText = `${this.templateFolder}/already-registered-verified.txt`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`

		// Compile templates
		const html = await compileTemplate(fileHtml, { username, passwordResetLink })
		const text = await compileTemplate(fileText, { username, passwordResetLink })

		// Send
		const subject = 'Willkommen zurück bei Mampfalot!'
		this.getAccount('hello@mampfalot.app').send(to, subject, text, html)
	}

	async sendUserAlreadyRegisteredButNotVerifiedMail(to, username, verificationToken) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/already-registered-unverified.html`
		const fileText = `${this.templateFolder}/already-registered-unverified.txt`
		const verificationLink = `${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`

		// Compile templates
		const html = await compileTemplate(fileHtml, { username, verificationLink, passwordResetLink })
		const text = await compileTemplate(fileText, { username, verificationLink, passwordResetLink })

		// Send
		const subject = 'Willkommen zurück bei Mampfalot!'
		this.getAccount('hello@mampfalot.app').send(to, subject, text, html)
	}

	async sendForgotUsernameMail(to, username) {
		// Prepare template data
		const fileHtml = `${this.templateFolder}/forgot-username.html`
		const fileText = `${this.templateFolder}/forgot-username.txt`
		const passwordResetLink = `${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}`

		// Compile templates
		const html = await compileTemplate(fileHtml, { passwordResetLink, username })
		const text = await compileTemplate(fileText, { passwordResetLink, username })

		// Send
		const subject = 'Dein Benutzername bei Mampfalot'
		this.getAccount('hello@mampfalot.app').send(to, subject, text, html)
	}

}

module.exports = Mailer
