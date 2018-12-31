'use strict'

const crypto = require('crypto')

module.exports = {

	/**
	 * A wrapper for async middleware.
	 * Makes it possible to omit a lot try...catch statements inside async
	 * middleware because it catches every error automatically and routes it
	 * to the next error handling middleware.
	 */
	asyncMiddleware: (fn) => {
		return (req, res, next) => {
			Promise
				.resolve(fn(req, res, next))
				.catch(next)
		}
	},

	/**
	 * Generates a random token with a length of <size>.
	 * @param {number} size The length of the token
	 * @returns {Promise<Token>} Contains the token
	 */
	generateRandomToken(size) {
		return new Promise((resolve, reject) => {
			crypto.randomBytes(size, (err, buff) => {
				if (err) return reject(err)
				resolve(buff.toString('hex'))
			})
		})
	}

}
