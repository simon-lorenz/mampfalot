const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const GroupMembers = require('./groupMembers')
const FoodType = require('./foodType')
const Place = require('./place')
const Util = require('./../util/util')

const Group = sequelize.define('groups', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true
	},
	name: {
		type: Sequelize.STRING,
		allowNull: false
	},
	defaultLunchTime: {
		type: Sequelize.TIME,
		allowNull: false,
		defaultValue: '12:30:00'
	},
	defaultVoteEndingTime: {
		type: Sequelize.TIME,
		allowNull: false,
		defaultValue: '12:20:00'
	},
	pointsPerDay: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 100
	},
	maxPointsPerVote: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 100
	},
	minPointsPerVote: {
		type: Sequelize.INTEGER,
		allowNull: false,
		defaultValue: 10
	}
}, {
	timestamps: false,
	freezeTableName: true
})

module.exports = Group