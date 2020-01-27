'use strict'

module.exports = (sequelize, DataTypes) => {
	const Absence = sequelize.define('Absence', {
		memberId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			unique: {
				name:'onlyOneAbsencePerLunchbreak',
				msg: 'This is already marked as absent.'
			}
		},
		lunchbreakId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			unique: {
				name:'onlyOneAbsencePerLunchbreak',
				msg: 'This is already marked as absent.'
			}
		}
	}, {
		tableName: 'absences',
		timestamps: true,
		name: {
			singular: 'absence',
			plural: 'absences'
		}
	})

	Absence.associate = models => {
		models.Absence.belongsTo(models.Lunchbreak, { foreignKey: 'lunchbreakId' })
		models.Absence.belongsTo(models.GroupMembers, { foreignKey: 'memberId', as: 'member' })
	}

	return Absence
}
