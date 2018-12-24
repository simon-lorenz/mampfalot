module.exports = (sequelize, DataTypes) => {
	const GroupMembers = sequelize.define('GroupMembers', {
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			validate: {
				notNull: {
					msg: 'userId cannot be null.'
				},
				isNumeric: {
					msg: 'userId has to be numeric.'
				},
				async exists (val) {
					let UserModel = sequelize.models.User
					let user = await UserModel.findByPk(val)

					if (!user) throw 'userId does not exist.'
				}
			}
		},
		groupId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE'
		},
		isAdmin: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		},
		color: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: '80D8FF'
		}
	}, {
		tableName: 'group_members',
		timestamps: false
	})

	return GroupMembers
}