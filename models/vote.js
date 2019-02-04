'use strict'

const { ValidationError, RequestError } = require('../classes/errors')

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

					if (!group) {
						throw new Error('This placeId does not belong to the associated group.')
					}
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
				isNumeric: {
					msg: 'Points has to be numeric.'
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

	Vote.beforeBulkCreate(async (votes) => {
		if (process.env.SEEDING === 'true')
			return

		const participantId = votes[0].participantId

		const lunchbreak = await Lunchbreak.findOne({
			attributes: ['groupId', 'date'],
			include: [
				{
					model: Participant,
					attributes: [],
					where: {
						id: participantId
					}
				},
				{
					model: Group,
					attributes: ['id', 'voteEndingTime', 'utcOffset', 'minPointsPerVote', 'maxPointsPerVote', 'pointsPerDay']
				}
			]
		})

		const config = lunchbreak.group

		// Calculate client time
		const clientTime = new Date()
		clientTime.setUTCMinutes(clientTime.getUTCMinutes() + config.utcOffset)

		// Lookup the groups voteEndingTime
		const voteEndingTime = new Date()
		voteEndingTime.setUTCFullYear(lunchbreak.date.split('-')[0])
		voteEndingTime.setUTCMonth(lunchbreak.date.split('-')[1])
		voteEndingTime.setUTCDate(lunchbreak.date.split('-')[2])
		voteEndingTime.setUTCHours(config.voteEndingTime.split(':')[0])
		voteEndingTime.setUTCMinutes(config.voteEndingTime.split(':')[1])
		voteEndingTime.setUTCSeconds(config.voteEndingTime.split(':')[2])

		if (process.env.LOG_LEVEL === 'debug') {
			console.log('ClientTime: ' +  clientTime)
			console.log('VoteEndingTime: ' +  voteEndingTime)
			console.log('User can vote: ' + !(clientTime > voteEndingTime))
		}

		if (clientTime > voteEndingTime) {
			throw new RequestError('The end of voting has been reached, therefore no new votes will be accepted.')
		}

		const placeIds = []
		let sum = 0
		for (const vote of votes) {
			const points = parseInt(vote.points)
			if (points > config.maxPointsPerVote) {
				const item = {
					field: 'points',
					value: points,
					message: `Points exceeds maxPointsPerVote (${config.maxPointsPerVote}).`
				}
				throw new ValidationError([item])
			}

			if (points < config.minPointsPerVote) {
				const item = {
					field: 'points',
					value: points,
					message: `Points deceeds minPointsPerVote (${config.minPointsPerVote}).`
				}
				throw new ValidationError([item])
			}

			sum += points
			placeIds.push(vote.placeId)
		}

		if (sum > config.pointsPerDay) {
			const item = {
				field: 'points',
				value: sum,
				message: `Sum of points exceeds pointsPerDay (${config.pointsPerDay}).`
			}
			throw new ValidationError([item])
		}

		for (let i = 0; i < placeIds.length; i++) {
			if (i !== placeIds.indexOf(placeIds[i])) {
				const item = {
					field: 'placeId',
					value: placeIds[i],
					message: 'Two votes had the same placeId.'
				}
				throw new ValidationError([item])
			}
		}
	})

	Vote.associate = function(models) {
		models.Vote.belongsTo(models.Place, { foreignKey: 'placeId' })
		models.Vote.belongsTo(models.Participant, { foreignKey: 'participantId' })
	}

	return Vote
}
