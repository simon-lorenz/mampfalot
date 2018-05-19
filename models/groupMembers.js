const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const Group = require('./group')
const User = require('./user')

const GroupMembers = sequelize.define('group_members', {
	userId: {
		type: Sequelize.INTEGER,
		references: {
			model: User,
			key: 'id'
		}
	},
	groupId: {
		type: Sequelize.INTEGER,
		references: {
			model: Group,
			key: 'id'
		}
	},
	authorizationLevel: {
		type: Sequelize.SMALLINT,
		allowNull: false,
		defaultValue: 0
	}
}, {
	timestamps: false,
	freezeTableName: true
})

module.exports = GroupMembers