const User = require('./../models').User
const Group = require('./../models').Group
const GroupMembers = require('./../models').GroupMembers
const Lunchbreak = require('./../models').Lunchbreak
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const Participant = require('../models').Participant
const db = require('./../models').sequelize
const data = require('./data')

module.exports = {
	async resetData() {
		let tables = ['comments', 'food_types', 'group_members', 'groups', 'lunchbreaks', 'participants', 'places', 'users', 'votes']
		let queries = []
		queries.push('SET FOREIGN_KEY_CHECKS = 0;')		
		for (let table of tables) {
			queries.push('TRUNCATE `mampfalot_test`.`' + table + '`;')
		}
		queries.push('SET FOREIGN_KEY_CHECKS = 1;')

		try {
			await db.query(queries.join(' '), { raw: true })
			await User.bulkCreate(data.users)
			await Group.bulkCreate(data.groups)
			await GroupMembers.bulkCreate(data.groupMembers)
			await Lunchbreak.bulkCreate(data.lunchbreaks)
			await FoodType.bulkCreate(data.foodTypes)
			await Place.bulkCreate(data.places)
			await Participant.bulkCreate(data.participants)
		} catch (error) {
			console.log(error)
			throw error
		}
		
	},
	async initialize() {
		await db.sync({ force: true })
	}
}