'use strict'

const crypto = require('crypto')

module.exports = {

	/**
	 * A wrapper for async middleware.
	 * Makes it possible to omit a lot try...catch statements inside async
	 * middleware because it catches every error automatically and routes it
	 * to the next error handling middleware.
	 */
	asyncMiddleware: fn => {
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
	},

	/**
	 * Checks if a date matches todays date.
	 * @param {string} date A date formatted as yyyy-mm-dd
	 */
	dateIsToday(date) {
		const today = new Date().toISOString().substring(0, 10)
		return date === today
	},

	/**
	 * Checks if the voteEndingTime of a lunchbreak
	 * is reached
	 * @param {number} lunchbreakId
	 * @returns {boolean}
	 */
	async voteEndingTimeReached(lunchbreakId) {
		const { Lunchbreak, Group } = require('../models')

		const lunchbreak = await Lunchbreak.findOne({
			attributes: ['date'],
			where: {
				id: lunchbreakId
			}
		})

		const config = await Group.findOne({
			attributes: ['voteEndingTime', 'utcOffset'],
			include: [
				{
					model: Lunchbreak,
					attributes: [],
					where: {
						id: lunchbreakId
					}
				}
			]
		})

		// Calculate client time
		const clientTime = new Date()
		clientTime.setUTCMinutes(clientTime.getUTCMinutes() + config.utcOffset)

		// Lookup the groups voteEndingTime
		const voteEndingTime = new Date()
		voteEndingTime.setUTCFullYear(lunchbreak.date.split('-')[0])
		voteEndingTime.setUTCMonth(Number(lunchbreak.date.split('-')[1]) - 1)
		voteEndingTime.setUTCDate(lunchbreak.date.split('-')[2])
		voteEndingTime.setUTCHours(config.voteEndingTime.split(':')[0])
		voteEndingTime.setUTCMinutes(config.voteEndingTime.split(':')[1])
		voteEndingTime.setUTCSeconds(config.voteEndingTime.split(':')[2])

		return clientTime > voteEndingTime
	}

}
