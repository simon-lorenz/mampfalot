const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const FoodType = require('./foodType')
const Group = require('./group')

const Place = sequelize.define('places', {
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
	foodTypeId: {
		type: Sequelize.STRING,
		references: {
			model: FoodType,
			key: 'id'
		}
	},
	name: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			notEmpty: true
		}
	}
}, {
	timestamps: false,
	freezeTableName: true
})

module.exports = Place