const crypto = require('crypto')
const fs = require('fs')

const moment = require('moment')

const GroupRepository = require('../group/group.repository')
const knex = require('../knex')

module.exports = {
	async connectToDatabase(max_tries, logger) {
		let currentTry = 1

		while (currentTry <= max_tries) {
			logger.info(`[Database] Trying to connect (${currentTry}/${max_tries}) ...`)

			try {
				await knex.raw('SELECT 1+1 AS result')
				logger.info(`[Database] Connection established!`)
				return
			} catch (error) {
				if (currentTry === max_tries) {
					logger.fatal({ error }, '[Database] Connection could not be established.')
					process.exit(1)
				} else {
					currentTry++
					await new Promise(resolve => setTimeout(resolve, 1000))
				}
			}
		}
	},

	async runMigrations(logger) {
		try {
			logger.info('[Database] Running migrations...')
			const migrateResult = await knex.migrate.latest()
			logger.info(`[Database] Ran ${migrateResult[1].length} new migrations`)
		} catch (error) {
			logger.fatal({ error }, '[Database] Migrations failed.')
			process.exit(1)
		}
	},

	/**
	 * Promisifies nodes readFile() function.
	 * Files have to be utf-8 encoded.
	 * @param {string} path
	 */
	async readFile(path) {
		return new Promise((resolve, reject) => {
			fs.readFile(path, { encoding: 'utf-8' }, (err, content) => {
				if (err) {
					reject(err)
				} else {
					resolve(content)
				}
			})
		})
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
