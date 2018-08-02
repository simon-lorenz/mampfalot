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
		user.password = bcrypt.hashSync(user.password, 12)
	})

	User.beforeBulkCreate(async (instances, options) => {
		let rounds
		process.env.NODE_ENV === 'test' ? rounds = 1 : rounds = 12

		for (instance of instances) {
			instance.password = await bcrypt.hash(instance.password, rounds)
		}
	})
	
	User.beforeUpdate((user, options) => {
		if (user.changed('password')) {
			user.password = bcrypt.hashSync(user.password, 12)
		}
	})

	return User
}