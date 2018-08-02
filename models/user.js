const bcrypt = require('bcrypt')

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('User', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				notEmpty: true
			}
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		}
	}, {
		tableName: 'users',
		timestamps: true,
		name: {
			singular: 'user',
			plural: 'users'
		},
		defaultScope: {
			attributes: {
				exclude: ['password', 'createdAt', 'updatedAt']
			}
		}
	})

	User.associate = function (models) {
		models.User.hasMany(models.Comment)
		models.User.hasMany(models.Participant)
		models.User.belongsToMany(models.Group, {
			through: models.GroupMembers
		})
	}
	
	User.beforeCreate((user, options) => {
		let salt = bcrypt.genSaltSync(12, 'a')
		user.password = bcrypt.hashSync(user.password, salt)
	})

	User.beforeBulkCreate((instances, options) => {
		for (instance of instances) {
			let salt = bcrypt.genSaltSync(12, 'a')
			instance.password = bcrypt.hashSync(instance.password, salt)
		}
	})
	
	User.beforeUpdate((user, options) => {
		if (user.changed('password')) {
			let salt = bcrypt.genSaltSync(12, 'a')
			user.password = bcrypt.hashSync(user.password, salt)
		}
	})

	return User
}