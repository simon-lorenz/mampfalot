const crypto = require('crypto')
const moment = require('moment')
const { GroupRepository } = require('../repositories')

module.exports = {
	/**
	 * A wrapper for async middleware.
	 * Makes it possible to omit a lot try...catch statements inside async
	 * middleware because it catches every error automatically and routes it
	 * to the next error handling middleware.
	 */
	asyncMiddleware: fn => {
		return (req, res, next) => {
			Promise.resolve(fn(req, res, next)).catch(next)
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
				if (err) {
					return reject(err)
				}

				resolve(buff.toString('hex'))
			})
		})
	},

	/**
	 * Checks if a date matches todays date.
	 * @param {string} date A date formatted as yyyy-mm-dd
	 */
	dateIsToday(date) {
		// TODO: Check timezone of requesting user/group
		return date === moment().format('YYYY-MM-DD')
	},

	/**
	 * Checks if the voteEndingTime of a lunchbreak
	 * is reached
	 * @param {number} groupId
	 * @param {string} date
	 * @returns {boolean}
	 */
	async voteEndingTimeReached(groupId, date) {
		const group = await GroupRepository.getGroupConfig(groupId)
		const requestingTime = moment().utc()
		const voteEndingTime = moment.utc(`${date} ${group.voteEndingTime}`, 'YYYY-MM-DD hh:mm:ss')
		requestingTime.add(group.utcOffset, 'minutes')
		return requestingTime.isAfter(voteEndingTime)
	}
}
