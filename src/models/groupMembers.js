'use strict'

module.exports = (sequelize, DataTypes) => {
	const GroupMembers = sequelize.define('GroupMembers', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
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
					const UserModel = sequelize.models.User
					const user = await UserModel.findByPk(val)

					if (!user) throw new Error('userId does not exist.')
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
			defaultValue: '#80d8ff'
		}
	}, {
		tableName: 'group_members',
		timestamps: false
	})

	GroupMembers.associate = function(models) {
		models.GroupMembers.belongsTo(models.User, { foreignKey: 'userId' })
	}

	return GroupMembers
}
