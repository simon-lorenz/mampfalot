const Sequelize = require('sequelize');
const sequelize = require('./../sequelize')
const bcrypt = require('bcrypt')

const User = sequelize.define('users', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true
	},
	name: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	email: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true,
		validate: {
			isEmail: true
		}
	},
	password: {
		type: Sequelize.STRING,
		allowNull: false
	}
}, {
	timestamps: true,
	freezeTableName: true
});

User.beforeCreate((user, options) => {
	user.password = bcrypt.hashSync(user.password, 12)
})

User.beforeBulkUpdate((user, options) => {
	if (user.attributes.password) {
		user.attributes.password = bcrypt.hashSync(user.attributes.password, 12)
	}
})

module.exports = User