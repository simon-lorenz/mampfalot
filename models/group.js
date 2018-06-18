module.exports = (sequelize, DataTypes) => {
	const Group = sequelize.define('Group', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		defaultLunchTime: {
			type: DataTypes.TIME,
			allowNull: false,
			defaultValue: '12:30:00'
		},
		defaultVoteEndingTime: {
			type: DataTypes.TIME,
			allowNull: false,
			defaultValue: '12:20:00'
		},
		pointsPerDay: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 100,
			validate: {
				min: 1
			}
		},
		maxPointsPerVote: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 100,
			validate: {
				min: 1
			}
		},
		minPointsPerVote: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 10,
			validate: {
				min: 1
			}
		}
	}, {
		tableName: 'groups',
		timestamps: false,
		name: {
			singular: 'group',
			plural: 'groups'
		}
	})

	Group.associate = function (models) {
		models.Group.hasMany(models.Place)
		models.Group.hasMany(models.FoodType)
		models.Group.hasMany(models.Lunchbreak)
		models.Group.belongsToMany(models.User, {
			through: models.GroupMembers,
			as: 'members',
			foreignKey: 'groupId',
			otherKey: 'userId'
		})
	}

	return Group
}