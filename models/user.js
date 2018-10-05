const bcrypt = require('bcrypt')

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('User', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		firstName: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: 'firstName cannot be empty'
				},
				notNull: {
					msg: 'firstName cannot be null'
				}
			}
		},
		lastName: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: 'lastName cannot be empty'
				},
				notNull: {
					msg: 'lastName cannot be null'
				}
			}
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: {
				args: true,
				msg: 'This E-Mail is already taken'
			},
			validate: {
				isEmail: {
					msg: 'This is not a valid e-mail-address'
				},
				notEmpty: {
					msg: 'E-Mail cannot be empty'
				},
				notNull: {
					msg: 'E-Mail cannot be null'
				}
			}
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: 'Password cannot be empty'
				},
				notNull: {
					msg: 'Password cannot be null'
				},
				len: {
					args: [8, 255],
					msg: 'Password has to be between 8 and 255 characters long'
				}
			}
		},
		verified: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		verificationToken: {
			type: DataTypes.STRING
		},
		passwordResetToken: {
			type: DataTypes.STRING
		},
		passwordResetExpiration: {
			type: DataTypes.DATE
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
				exclude: ['password', 'passwordResetToken', 'passwordResetExpiration', 'verificationToken', 'createdAt', 'updatedAt']
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

		for (let instance of instances) {
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
