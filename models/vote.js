const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const Place = require('./place')
const Participant = require('./participant')

const Vote = sequelize.define('votes', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true
	},
	participantId: {
		type: Sequelize.INTEGER,
		references: {
			model: Participant,
			key: 'id'
		}
	},
	placeId: {
		type: Sequelize.INTEGER,
		references: {
			model: Place,
			key: 'id'
		}
	},
	points: {
		type: Sequelize.INTEGER,
		allowNull: false
	}
}, {
	timestamps: false,
	freezeTableName: true
})

module.exports = Vote