const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const Lunchbreak = require('./lunchbreak')
const User = require('./user')

const Participant = sequelize.define('participants', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true
	},
	lunchbreakId: {
		type: Sequelize.INTEGER,
		references: {
			model: Lunchbreak,
			key: 'id'
		}
	},
	userId: {
		type: Sequelize.INTEGER,
		references: {
			model: User,
			key: 'id'
		}
	},
	amountSpent: {
		type: Sequelize.DECIMAL
	},
	lunchTimeSuggestion: {
		type: Sequelize.TIME
	}
}, {
	timestamps: false,
	freezeTableName: true
})

module.exports = Participant