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
				throw new Exception(`Unkown mail account "${email}"`)
		}
	}

	/**
	 * Sends a welcome mail which contains a verification link
	 * @param {string} to The users email-address
	 * @param {string} name The users name
	 * @param {string} id The users id
	 * @param {string} verificationToken A verification token
	 */
	sendWelcomeMail(to, name, id, verificationToken) {
		let transport = nodemailer.createTransport(this.getMailOptions('hello@mampfalot.app'))
		let verificationLink = `https://mampfalot.app/verify/${verificationToken}?userId=${id}`
		let mailOptions = {
			from: '"Mampfalot" <hello@mampfalot.app>',
			to: to,
			subject: 'Willkommen bei Mampfalot!',
			text: this.getWelcomeText(name, verificationLink),
			html: this.getWelcomeHTML(name, verificationLink)
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
	 * @param {*} name The users name
	 * @param {*} id The users id
	 * @param {*} token A password reset token
	 */
	sendPasswordResetMail(to, name, id, token) {
		let transport = nodemailer.createTransport(this.getMailOptions('support@mampfalot.app'))

		let resetLink = `https://mampfalot.app/password-reset/${token}?userId=${id}`

		let mailOptions = {
			from: '"Mampfalot Support" <support@mampfalot.app>',
			to: to,
			subject: 'Dein neues Passwort für Mampfalot',
			text: this.getPasswordResetText(name, resetLink),
			html: this.getPasswordResetHTML(name, resetLink)
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
	 * @param {*} name The user name
	 * @param {*} resetLink The password reset link
	 */
	getPasswordResetHTML(name, resetLink) {
		return `
			<p>
				Hi ${name}, <br>
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
	 * @param {*} name
	 * @param {*} resetLink
	 */
	getPasswordResetText(name, resetLink) {
		return `
			Hi ${name},
			du hast kürzlich ein neues Passwort für Mampfalot angefordert.
			Klicke hier, um ein neues Passwort zu vergeben: ${resetLink}
			Dieser Link ist 30 Minuten lang gültig.
			Viele Grüße
			Dein Mampfalot-Team
		`
	}

	/**
	 * Returns the htmln content of a welcome email
	 * @param {string} name The users name, used in the greeting
	 * @param {string} verificationLink A link where the user can verify his email-address
	 */
	getWelcomeHTML(name, verificationLink) {
		return `
			<html>
				<head>
				</head>
				<body>
					<p>
						Hi ${name}! <br>
						<br>
						Herzlich willkommen bei Mampfalot!<br>
						Benutze folgenden Link, um deine E-Mail Adresse zu bestätigen: <a href="${verificationLink}">${verificationLink}</a><br>
						<br>
						Viele Grüße<br>
						Dein Mampfalot-Team
					</p>
				</body>
			</html>
		`
	}

	getWelcomeText(name, verificationLink) {
		return `
			Hi ${name}!
			Herzlich willkommen bei Mampfalot!
			Benutze folgenden Link, um deine E-Mail Adresse zu bestätgen: ${verificationLink}
			Viele Grüße
			Dein Mampfalot-Team
		`
	}

}

module.exports = Mailer
