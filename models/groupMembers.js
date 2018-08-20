module.exports = (sequelize, DataTypes) => {
	const GroupMembers = sequelize.define('GroupMembers', {
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