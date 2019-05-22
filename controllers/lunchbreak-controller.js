'use strict'

const ResourceLoader = require('../classes/resource-loader')
const user = require('../classes/user')

class LunchbreakController {

	async getLunchbreaks(groupId, from, to) {
		console.log(`Getting lunchbreaks for group ${groupId}`)
		console.log(`${from} ${to}`)
	}

	async getLunchbreak(groupId, date) {
		const lunchbreak = await ResourceLoader.loadLunchbreak(groupId, date)
		await user.can.readLunchbreak(lunchbreak)
		return lunchbreak.toJSON()
	}

}

module.exports = new LunchbreakController()
