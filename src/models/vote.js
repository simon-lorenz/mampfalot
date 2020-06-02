module.exports = (sequelize, DataTypes) => {
	const Vote = sequelize.define(
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

	Vote.associate = models => {
		models.Vote.belongsTo(models.Place, { foreignKey: 'placeId' })
		models.Vote.belongsTo(models.Participant, { foreignKey: 'participantId' })
	}

	return Vote
}
