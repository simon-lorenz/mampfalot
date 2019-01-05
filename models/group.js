'use strict'

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
				min: 1,
				equalOrGreaterThanMaxPointsPerVote(value) {
					if (value < this.maxPointsPerVote) {
						throw new Error('pointsPerDay has to be equal or greater than maxPointsPerVote.')
					}
				}
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
						throw new Error('maxPointsPerVote has to be greater than or equal to minPointsPerVote.')
					}
				},
				equalOrLessThanPointsPerDay(value) {
					if (value > this.pointsPerDay) {
						throw new Error('maxPointsPerVote has to be less than or equal to pointsPerDay.')
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
						throw new Error('minPointsPerVote has to be less than or equal to maxPointsPerVote.')
					}
				},
				equalOrLessThanPointsPerDay(value) {
					if (value > this.pointsPerDay) {
						throw new Error('minPointsPerVote has to be less than or equal to pointsPerDay.')
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
					throw new Error('defaultVoteEndingTime has to be less than defaultLunchTime.')
				}
			}
		}
	})

	Group.associate = function (models) {
		models.Group.hasMany(models.Invitation, { foreignKey: 'groupId' })
		models.Group.hasMany(models.Place, { foreignKey: 'groupId' })
		models.Group.hasMany(models.FoodType, { foreignKey: 'groupId' })
		models.Group.hasMany(models.Lunchbreak, { foreignKey: 'groupId' })
		models.Group.belongsToMany(models.User, {
			through: models.GroupMembers,
			as: 'members',
			foreignKey: 'groupId'
		})
	}

	return Group
}
