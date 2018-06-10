module.exports = (sequelize, DataTypes) => {
	const GroupMembers = sequelize.define('GroupMembers', {
		userId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		groupId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		authorizationLevel: {
			type: DataTypes.SMALLINT,
			allowNull: false,
			defaultValue: 0
		},
		color: {
			type: DataTypes.STRING,
			allowNull: true,
			default: '80D8FF'
		}
	}, {
		tableName: 'group_members',
		timestamps: false
	})

	return GroupMembers
}