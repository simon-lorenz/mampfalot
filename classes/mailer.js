const nodemailer = require('nodemailer')

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
	sendWelcomeMail(to, username, verificationToken) {
		let transport = nodemailer.createTransport(this.getMailOptions('hello@mampfalot.app'))
		let verificationLink = `${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}`
		let mailOptions = {
			from: '"Mampfalot" <hello@mampfalot.app>',
			to: to,
			subject: 'Willkommen bei Mampfalot!',
			text: this.getWelcomeText(username, verificationLink),
			html: this.getWelcomeHTML(username, verificationLink)
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
	sendPasswordResetMail(to, username, token) {
		let transport = nodemailer.createTransport(this.getMailOptions('support@mampfalot.app'))

		let resetLink = `${process.env.FRONTEND_BASE_URL}/confirm-password-reset?token=${token}&user=${username}`

		let mailOptions = {
			from: '"Mampfalot Support" <support@mampfalot.app>',
			to: to,
			subject: 'Dein neues Passwort für Mampfalot',
			text: this.getPasswordResetText(username, resetLink),
			html: this.getPasswordResetHTML(username, resetLink)
		}

		return new Promise((resolve, reject) => {
			transport.sendMail(mailOptions, (err, info) => {
					if (err) return reject(err)
					resolve(info)
				})
		})
	}

	sendUserAlreadyRegisteredMail(to, username) {
		const transport = nodemailer.createTransport(this.getMailOptions('hello@mampfalot.app'))

		const mailOptions = {
			from: '"Mampfalot" <hello@mampfalot.app>',
			to: to,
			subject: 'Willkommen zurück bei Mampfalot!',
			text: this.getUserAlreadyRegisteredText(username),
			html: this.getUserAlreadyRegisteredHTML(username)
		}

		return new Promise((resolve, reject) => {
			transport.sendMail(mailOptions, (err, info) => {
					if (err) return reject(err)
					resolve(info)
				})
		})
	}

	sendUserAlreadyRegisteredButNotVerifiedMail(to, username, verificationToken) {
		const transport = nodemailer.createTransport(this.getMailOptions('hello@mampfalot.app'))

		const mailOptions = {
			from: '"Mampfalot" <hello@mampfalot.app>',
			to: to,
			subject: 'Willkommen zurück bei Mampfalot!',
			text: this.getUserAlreadyRegisteredButNotVerifiedText(username, verificationToken),
			html: this.getUserAlreadyRegisteredButNotVerifiedHTML(username, verificationToken)
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
	 * @param {*} resetLink The password reset link
	 */
	getPasswordResetHTML(username, resetLink) {
		return `
			<p>
				Hi ${username}, <br>
				<br>
				du hast kürzlich ein neues Passwort für Mampfalot angefordert.<br>
				Klicke hier, um ein neues Passwort zu vergeben: <br>
				<br>
				<a href="${resetLink}">
					<button>Passwort zurücksetzen</button>
				</a>
				<br>
				<br>
				Dieser Link ist 30 Minuten lang gültig.
				<br>
				<br>
				Viele Grüße<br>
				Dein Mampfalot-Team
			</p>
		`
	}

	/**
	 * Returns the text content of a password reset mail
	 * @param {*} username
	 * @param {*} resetLink
	 */
	getPasswordResetText(username, resetLink) {
		return `
			Hi ${username},
			du hast kürzlich ein neues Passwort für Mampfalot angefordert.
			Klicke hier, um ein neues Passwort zu vergeben: ${resetLink}
			Dieser Link ist 30 Minuten lang gültig.
			Viele Grüße
			Dein Mampfalot-Team
		`
	}

	/**
	 * Returns the htmln content of a welcome email
	 * @param {string} username
	 * @param {string} verificationLink A link where the user can verify his email-address
	 */
	getWelcomeHTML(username, verificationLink) {
		return `
			<html>
				<head>
				</head>
				<body>
					<p>
						Hi ${username}! <br>
						<br>
						Herzlich willkommen bei Mampfalot!<br>
						Benutze folgenden Link, um deinen Account zu aktivieren: <a href="${verificationLink}">${verificationLink}</a><br>
						<br>
						Viele Grüße<br>
						Dein Mampfalot-Team
					</p>
				</body>
			</html>
		`
	}

	getWelcomeText(username, verificationLink) {
		return `
			Hi ${username}!
			Herzlich willkommen bei Mampfalot!
			Benutze folgenden Link, um deinen Account zu aktivieren: ${verificationLink}
			Viele Grüße
			Dein Mampfalot-Team
		`
	}

	getUserAlreadyRegisteredText(username) {
		return `
			Hi,

			danke für deine Registrierung!
			Wir haben festgestellt, dass unter dieser E-Mail-Adresse bereits ein
			Acccount mit dem Namen ${username} vorhanden ist.

			Für den Fall, dass du dein Passwort vergessen hast, kannst du es hier
			zurücksetzen: ${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}

			Viele Grüße
			Dein Mampfalot-Team
		`
	}

	getUserAlreadyRegisteredHTML(username) {
		return `
			<html>
				<head>
				</head>
				<body>
					<p>
						Hi,<br>
						<br>
						danke für deine Registrierung!<br>
						Wir haben festgestellt, dass unter dieser E-Mail-Adresse bereits ein
						Acccount mit dem Namen ${username} vorhanden ist.<br>
						<br>
						Für den Fall, dass du dein Passwort vergessen hast, kannst du es hier
						zurücksetzen: ${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username} <br>
						<br>
						Viele Grüße<br>
						Dein Mampfalot-Team
					</p>
				</body>
			</html>
		`
	}

	getUserAlreadyRegisteredButNotVerifiedText(username, verificationToken) {
		return `
			Hi,

			danke für deine Registrierung!
			Wir haben festgestellt, dass unter dieser E-Mail-Adresse bereits ein
			Acccount mit dem Namen ${username} vorhanden ist.

			Klicke hier, um deinen Account zu aktivieren: ${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken}

			Für den Fall, dass du dein Passwort vergessen hast, kannst du es hier
			zurücksetzen: ${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username}

			Viele Grüße
			Dein Mampfalot-Team
		`
	}

	getUserAlreadyRegisteredButNotVerifiedHTML(username, verificationToken) {
		return `
			<html>
				<head>
				</head>
				<body>
					<p>
						Hi,<br>
						<br>
						danke für deine Registrierung!<br>
						Wir haben festgestellt, dass unter dieser E-Mail-Adresse bereits ein
						Acccount mit dem Namen ${username} vorhanden ist.<br>
						<br>
						Klicke hier, um deinen Account zu aktivieren: ${process.env.FRONTEND_BASE_URL}/confirm-verification?user=${username}&token=${verificationToken} <br>
						<br>
						Für den Fall, dass du dein Passwort vergessen hast, kannst du es hier
						zurücksetzen: ${process.env.FRONTEND_BASE_URL}/request-password-reset?user=${username} <br>
						<br>
						Viele Grüße<br>
						Dein Mampfalot-Team
					</p>
				</body>
			</html>
		`
	}

}

module.exports = Mailer
