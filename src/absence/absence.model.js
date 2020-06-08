const { DataTypes } = require('sequelize')
const { sequelize } = require('../sequelize')

const AbsenceModel = sequelize.define(
	'Absence',
	{
		memberId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			unique: {
				name: 'onlyOneAbsencePerLunchbreak',
				msg: 'This is already marked as absent.'
			}
		},
		lunchbreakId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			unique: {
				name: 'onlyOneAbsencePerLunchbreak',
				msg: 'This is already marked as absent.'
			}
		}
	},
	{
		tableName: 'absences',
		timestamps: true,
		name: {
			singular: 'absence',
			plural: 'absences'
		}
	}
)

AbsenceModel.associate = models => {
	models.Absence.belongsTo(models.Lunchbreak, { foreignKey: 'lunchbreakId' })
	models.Absence.belongsTo(models.GroupMembers, { foreignKey: 'memberId', as: 'member' })
}

module.exports = AbsenceModel
