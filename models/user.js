'use strict'

const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('User', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		username: {
			type: DataTypes.STRING,
			unique: {
				args: true,
				msg: 'This username is already taken'
			},
			allowNull: false,
			validate: {
				notEmpty: {
					msg: 'username cannot be empty'
				},
				notNull: {
					msg: 'username cannot be null'
				},
				len: {
					args: [3, 255],
					msg: 'The username must contain 3-255 characters'
				},
				validChars(value) {
					const regex = new RegExp('^[a-z-_0-9]*$')
					if (!regex.test(value))
						throw new Error('username can only contain [a-z-_0-9]')
				}
			}
		},
		firstName: {
			type: DataTypes.STRING
		},
		lastName: {
			type: DataTypes.STRING
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
				exclude: ['password', 'passwordResetToken', 'passwordResetExpiration', 'verificationToken']
			}
		}
	})

	User.associate = function (models) {
		models.User.hasMany(models.Invitation, { foreignKey: 'fromId' })
		models.User.hasMany(models.Invitation, { foreignKey: 'toId' })
		models.User.hasOne(models.GroupMembers, { as: 'config', foreignKey: 'userId' })
		models.User.belongsToMany(models.Group, {
			through: models.GroupMembers,
			foreignKey: 'userId'
		})
	}

	User.beforeCreate((user) => {
		user.password = bcrypt.hashSync(user.password, 12)
	})

	User.beforeBulkCreate(async (instances) => {
		let rounds
		process.env.NODE_ENV === 'test' ? rounds = 1 : rounds = 12

		for (const instance of instances) {
			instance.password = await bcrypt.hash(instance.password, rounds)
		}
	})

	User.beforeUpdate((user) => {
		if (user.changed('password')) {
			user.password = bcrypt.hashSync(user.password, 12)
		}
	})

	return User
}
