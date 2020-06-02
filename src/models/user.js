module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define(
		'User',
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			username: {
				type: DataTypes.STRING,
				unique: true,
				allowNull: false
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
				unique: true
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false
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
		},
		{
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
		}
	)

	User.associate = models => {
		models.User.hasMany(models.Invitation, { foreignKey: 'fromId' })
		models.User.hasMany(models.Invitation, { foreignKey: 'toId' })
		models.User.hasOne(models.GroupMembers, { as: 'config', foreignKey: 'userId' })
		models.User.belongsToMany(models.Group, {
			through: models.GroupMembers,
			foreignKey: 'userId'
		})
	}

	return User
}
