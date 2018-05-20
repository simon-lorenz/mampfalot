const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const User = require('./user')
const Lunchbreak = require('./lunchbreak')

const Comment = sequelize.define('comments', {
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
	comment: {
		type: Sequelize.TEXT,
		allowNull: false,
		validate: {
			notEmpty: true
		}
	}
}, {
	timestamps: true,
	freezeTableName: true
})

module.exports = Comment