'use strict'

module.exports = (sequelize, DataTypes) => {
	const { Group, Participant, Lunchbreak, Place } = sequelize.models

	const Vote = sequelize.define('Vote', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		participantId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			validate: {
				notNull: {
					msg: 'participantId cannot be null.'
				}
			}
		},
		placeId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			validate: {
				notNull: {
					msg: 'placeId cannot be null.'
				},
				async belongsToGroup (val) {
					const group = await Group.findOne({
						attributes: ['id'],
						include: [
							{
								model: Place,
								where: {
									id: val
								}
							},
							{
								model: Lunchbreak,
								include: [
									{
										model: Participant,
										where: {
											id: this.participantId
										}
									}
								]
							}
						]
					})

					if (!group)
						throw new Error('This placeId does not belong to the associated group.')
				}
			}
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false,
			validate: {
				notNull: {
					msg: 'Points cannot be null.'
				},
				isInt: {
					msg: 'Points must be an integer.'
				}
			}
		}
	}, {
		tableName: 'votes',
		timestamps: false,
		name: {
			singular: 'vote',
			plural: 'votes'
		}
	})

	Vote.associate = models => {
		models.Vote.belongsTo(models.Place, { foreignKey: 'placeId' })
		models.Vote.belongsTo(models.Participant, { foreignKey: 'participantId' })
	}

	return Vote
}
