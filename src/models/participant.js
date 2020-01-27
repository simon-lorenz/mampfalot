'use strict'

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
				msg: 'This member already participates.'
			}
		},
		memberId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL',
			unique: {
				name:'participateOnceOnly',
				msg: 'This member already participates.'
			}
		},
		resultId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL',
			validate: {
				async belongsToGroup () {
					if (this.resultId === null) return

					const { Group, Lunchbreak, Place } = sequelize.models

					const group = await Group.findOne({
						attributes: ['id'],
						include: [
							{
								model: Lunchbreak,
								where: {
									id: this.lunchbreakId
								}
							},
							{
								model: Place,
								where: {
									id: this.resultId
								}
							}
						]
					})

					if (!group)
						throw new Error('This place does not belong to the associated group.')
				}
			}
		},
		amountSpent: {
			type: DataTypes.DECIMAL(10, 2),
			get() {
				// Parsing as float, because sequelize would return a string.
				// See https://github.com/sequelize/sequelize/issues/8019
				return parseFloat(this.getDataValue('amountSpent'))
			}
		}
	}, {
		tableName: 'participants',
		timestamps: false,
		name: {
			singular: 'participant',
			plural: 'participants'
		}
	})

	Participant.associate = models => {
		models.Participant.belongsTo(models.GroupMembers, { foreignKey: 'memberId', as: 'member' })
		models.Participant.belongsTo(models.Lunchbreak, { foreignKey: 'lunchbreakId' })
		models.Participant.hasMany(models.Vote, { foreignKey: 'participantId' })
		models.Participant.belongsTo(models.Place, { foreignKey: 'resultId', as: 'result' })
	}

	return Participant
}