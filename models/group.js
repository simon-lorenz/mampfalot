module.exports = (sequelize, DataTypes) => {
	const Group = sequelize.define('Group', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
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
				min: 1,
				equalOrGreaterThanMinPointsPerVote(value) {
					if (value < this.minPointsPerVote) {
						throw 'maxPointsPerVote has to be greater than or equal to minPointsPerVote.'
					}
				},
				equalOrLessThanPointsPerDay(value) {
					if (value > this.pointsPerDay) {
						throw 'maxPointsPerVote has to be less than or equal to pointsPerDay.'
					}
				},
			}
		},
		minPointsPerVote: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 10,
			validate: {
				min: 1,
				equalOrLessThanMaxPointsPerVote(value) {
					if (value > this.maxPointsPerVote) {
						throw 'minPointsPerVote has to be less than or equal to maxPointsPerVote.'
					}
				},
				equalOrLessThanPointsPerDay(value) {
					if (value > this.pointsPerDay) {
						throw 'minPointsPerVote has to be less than or equal to pointsPerDay.'
					}
				}
			}
		}
	}, {
		tableName: 'groups',
		timestamps: false,
		name: {
			singular: 'group',
			plural: 'groups'
		},
		validate: {
			timeValidator() {
				if (this.defaultLunchTime < this.defaultVoteEndingTime) {
					throw 'defaultVoteEndingTime has to be less than defaultLunchTime.'
				}
			}
		}
	})

	Group.associate = function (models) {
		models.Group.hasMany(models.Place, { onDelete: 'CASCADE' })
		models.Group.hasMany(models.FoodType, { onDelete: 'CASCADE' })
		models.Group.hasMany(models.Lunchbreak, { onDelete: 'CASCADE' })
		models.Group.belongsToMany(models.User, {
			onDelete: 'CASCADE',
			through: models.GroupMembers,
			as: 'members'
		})
	}

	Group.loadScopes = function (models) {

		Group.addScope('ofUser', function(userId) {
			return {
				include: [
					models.Place,
					models.FoodType,
					models.Lunchbreak,
					{
						model: models.User,
						as: 'members',
						where: {
							id: userId
						},
						through: {
							as: 'config',
							attributes: ['color', 'isAdmin']
						}
					}
				]
			}
		})

	}

	return Group
}
