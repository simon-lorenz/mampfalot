module.exports = (sequelize, DataTypes) => {
	const Group = sequelize.define(
		'Group',
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			name: {
				type: DataTypes.STRING,
				allowNull: false
			},
			lunchTime: {
				type: DataTypes.TIME,
				allowNull: false
			},
			voteEndingTime: {
				type: DataTypes.TIME,
				allowNull: false
			},
			utcOffset: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			pointsPerDay: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			maxPointsPerVote: {
				type: DataTypes.INTEGER,
				allowNull: false
			},
			minPointsPerVote: {
				type: DataTypes.INTEGER,
				allowNull: false
			}
		},
		{
			tableName: 'groups',
			timestamps: false,
			name: {
				singular: 'group',
				plural: 'groups'
			}
		}
	)

	Group.associate = models => {
		models.Group.hasMany(models.Invitation, { foreignKey: 'groupId' })
		models.Group.hasMany(models.Place, { foreignKey: 'groupId' })
		models.Group.hasMany(models.Lunchbreak, { foreignKey: 'groupId' })
		models.Group.belongsToMany(models.User, {
			through: models.GroupMembers,
			as: 'members',
			foreignKey: 'groupId'
		})
	}

	return Group
}
