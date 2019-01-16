'use strict'

const User = require('./../models').User
const Group = require('./../models').Group
const GroupMembers = require('./../models').GroupMembers
const Lunchbreak = require('./../models').Lunchbreak
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const Participant = require('../models').Participant
const Vote = require('../models').Vote
const Comment = require('../models').Comment
const Invitation = require('../models').Invitation
const db = require('./../models').sequelize
const data = require('./data')

module.exports = {
	async resetData() {
		const tables = ['comments', 'food_types', 'group_members', 'groups', 'invitations', 'lunchbreaks', 'participants', 'places', 'users', 'votes']
		const queries = []
		queries.push('SET FOREIGN_KEY_CHECKS = 0;')
		for (const table of tables) {
			queries.push(`TRUNCATE \`${process.env.DB_NAME}\`.\`${table}\`;`)
		}
		queries.push('SET FOREIGN_KEY_CHECKS = 1;')

		try {
			await db.query(queries.join(' '), { raw: true })
			await User.bulkCreate(data.users)
			await Group.bulkCreate(data.groups)
			await GroupMembers.bulkCreate(data.groupMembers)
			await Invitation.bulkCreate(data.invitations)
			await FoodType.bulkCreate(data.foodTypes)
			await Place.bulkCreate(data.places)
			await Lunchbreak.bulkCreate(data.lunchbreaks)
			await Participant.bulkCreate(data.participants)
			await Vote.bulkCreate(data.votes)
			await Comment.bulkCreate(data.comments)
		} catch (error) {
			console.log(error)
			throw error
		}

	},
	async initialize() {
		await db.sync({ force: true })
	}
}
