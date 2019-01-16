'use strict'

module.exports = (sequelize, DataTypes) => {
	const Lunchbreak = sequelize.define('Lunchbreak', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		groupId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			unique: 'oneLuchbreakPerDayPerGroup'
		},
		result: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL'
		},
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
			unique: {
				name: 'oneLuchbreakPerDayPerGroup',
				msg: 'A lunchbreak at this date already exists.'
			}
		},
		lunchTime: {
			type: DataTypes.TIME,
			allowNull: false
		},
		voteEndingTime: {
			type: DataTypes.TIME,
			allowNull: false,
			validate: {
				compareWithLunchTime(value) {
					if (value > this.lunchTime) {
						throw new Error('voteEndingTime cannot be greater than lunchTime.')
					}
				}
			}
		}
	}, {
		tableName: 'lunchbreaks',
		timestamps: false,
		name: {
			singular: 'lunchbreak',
			plural: 'lunchbreaks'
		}
	})

	Lunchbreak.associate = function (models) {
		models.Lunchbreak.belongsTo(models.Group, { foreignKey: 'groupId' })
		models.Lunchbreak.hasMany(models.Comment, { foreignKey: 'lunchbreakId' })
		models.Lunchbreak.hasMany(models.Participant, { foreignKey: 'lunchbreakId' })
		models.Lunchbreak.belongsTo(models.Place, { foreignKey: 'result' })
	}

	return Lunchbreak
}
