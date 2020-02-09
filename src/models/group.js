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
				allowNull: false,
				defaultValue: '12:30:00'
			},
			voteEndingTime: {
				type: DataTypes.TIME,
				allowNull: false,
				defaultValue: '12:20:00'
			},
			utcOffset: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 0,
				validate: {
					min: {
						args: -720,
						msg: 'utcOffset cannot be less than -720'
					},
					max: {
						args: 720,
						msg: 'utcOffset cannot be greater than 720'
					},
					validOffset: value => {
						if (value % 60 !== 0) {
							throw new Error('This is not a valid UTC offset.')
						}
					}
				}
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
					}
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
		},
		{
			tableName: 'groups',
			timestamps: false,
			name: {
				singular: 'group',
				plural: 'groups'
			},
			validate: {
				timeValidator() {
					if (this.lunchTime < this.voteEndingTime) {
						throw new Error('voteEndingTime has to be less than lunchTime.')
					}
				}
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
