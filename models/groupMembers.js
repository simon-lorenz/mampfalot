module.exports = (sequelize, DataTypes) => {
	const GroupMembers = sequelize.define('GroupMembers', {
		authorizationLevel: {
			type: DataTypes.SMALLINT,
			allowNull: false,
			defaultValue: 0
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