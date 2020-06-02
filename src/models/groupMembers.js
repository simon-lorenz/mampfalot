module.exports = (sequelize, DataTypes) => {
	const GroupMembers = sequelize.define(
		'GroupMembers',
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			userId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				onDelete: 'CASCADE'
			},
			groupId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				onDelete: 'CASCADE'
			},
			isAdmin: {
				type: DataTypes.BOOLEAN,
				allowNull: false
			},
			color: {
				type: DataTypes.STRING,
				allowNull: true
			}
		},
		{
			tableName: 'group_members',
			timestamps: false
		}
	)

	GroupMembers.associate = models => {
		models.GroupMembers.belongsTo(models.User, { foreignKey: 'userId' })
	}

	return GroupMembers
}
