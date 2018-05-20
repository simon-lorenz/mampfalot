const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const Group = require('./group')

const FoodType = sequelize.define('food_types', {
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
	type: {
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

module.exports = FoodType