const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const Group = require('./group')
const Place = require('./place')

const Lunchbreak = sequelize.define('lunchbreaks', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true
	},
	groupId: {
		type: Sequelize.INTEGER,
		references: {
			model: Group,
			key: 'id'
		}
	},
	result: {
		type: Sequelize.INTEGER,
		references: {
			model: Place,
			key: 'id'
		}
	},
	date: {
		type: Sequelize.DATE,
		allowNull: false,
	},
	lunchTime: {
		type: Sequelize.TIME,
		allowNull: false
	},
	voteEndingTime: {
		type: Sequelize.TIME,
		allowNull: false
	}
}, {
	timestamps: false,
	freezeTableName: true
})

module.exports = Lunchbreak