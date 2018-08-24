const Util = require('../util/util')

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
						throw value + ' is < ' + this.minPointsPerVote
					}
				},
				equalOrLessThanPointsPerDay(value) {
					if (value > this.pointsPerDay) {
						throw value + ' is > ' + this.pointsPerDay
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
						throw value + ' is > ' + this.maxPointsPerVote
					}
				},
				equalOrLessThanPointsPerDay(value) {
					if (value > this.pointsPerDay) {
						throw value + ' is > ' + this.pointsPerDay
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
			times() {
				if (this.defaultLunchTime < this.defaultVoteEndingTime) {
					throw 'DefaultLunchTime has to be greater or equal to defaultVoteEndingTime'
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

		Group.addScope('ofUser', function(user) {
			return {
				where: {
					id: {
						in: Util.getGroupIds(user, false)
					}
				},
				include: [
					models.Place,
					models.FoodType,
					models.Lunchbreak,
					{
						model: models.User,
						as: 'members',
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