const { DataTypes } = require('sequelize')
const { sequelize } = require('../sequelize')

const VoteModel = sequelize.define(
	'Vote',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		participantId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE'
		},
		placeId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE'
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	},
	{
		tableName: 'votes',
		timestamps: false,
		name: {
			singular: 'vote',
			plural: 'votes'
		}
	}
)

VoteModel.associate = models => {
	models.Vote.belongsTo(models.Place, { foreignKey: 'placeId' })
	models.Vote.belongsTo(models.Participant, { foreignKey: 'participantId' })
}

module.exports = VoteModel
