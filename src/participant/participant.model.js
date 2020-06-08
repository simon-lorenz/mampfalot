const { DataTypes } = require('sequelize')
const { sequelize } = require('../sequelize')

const ParticipantModel = sequelize.define(
	'Participant',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		lunchbreakId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			unique: {
				name: 'participateOnceOnly',
				msg: 'This member already participates.'
			}
		},
		memberId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL',
			unique: {
				name: 'participateOnceOnly',
				msg: 'This member already participates.'
			}
		},
		resultId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL'
		},
		amountSpent: {
			type: DataTypes.DECIMAL(10, 2),
			get() {
				// Parsing as float, because sequelize would return a string.
				// See https://github.com/sequelize/sequelize/issues/8019
				return parseFloat(this.getDataValue('amountSpent'))
			}
		}
	},
	{
		tableName: 'participants',
		timestamps: false,
		name: {
			singular: 'participant',
			plural: 'participants'
		}
	}
)

ParticipantModel.associate = models => {
	models.Participant.belongsTo(models.GroupMembers, { foreignKey: 'memberId', as: 'member' })
	models.Participant.belongsTo(models.Lunchbreak, { foreignKey: 'lunchbreakId' })
	models.Participant.hasMany(models.Vote, { foreignKey: 'participantId' })
	models.Participant.belongsTo(models.Place, { foreignKey: 'resultId', as: 'result' })
}

module.exports = ParticipantModel
