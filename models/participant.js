'use strict'

const { RequestError } = require('../classes/errors')
const { voteEndingTimeReached } = require('../util/util')

module.exports = (sequelize, DataTypes) => {
	const Participant = sequelize.define('Participant', {
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
				name:'participateOnceOnly',
				msg: 'This user already participates.'
			}
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL',
			unique: {
				name:'participateOnceOnly',
				msg: 'This user already participates.'
			}
		},
		amountSpent: {
			type: DataTypes.DECIMAL
		}
	}, {
		tableName: 'participants',
		timestamps: false,
		name: {
			singular: 'participant',
			plural: 'participants'
		}
	})

	Participant.beforeCreate(async (instance) => {
		if (await voteEndingTimeReached(instance.lunchbreakId))
			throw new RequestError('The end of voting has been reached, therefore you cannot participate anymore.')
	})

	Participant.beforeDestroy(async (instance) => {
		if (await voteEndingTimeReached(instance.lunchbreakId))
			throw new RequestError('The end of voting has been reached, therefore this participant cannot be deleted.')
	})

	Participant.associate = function (models) {
		models.Participant.belongsTo(models.User, { foreignKey: 'userId' })
		models.Participant.belongsTo(models.Lunchbreak, { foreignKey: 'lunchbreakId' })
		models.Participant.hasMany(models.Vote, { foreignKey: 'participantId' })
	}

	return Participant
}
