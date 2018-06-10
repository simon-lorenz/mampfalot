module.exports = (sequelize, DataTypes) => {
	const Vote = sequelize.define('Vote', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		participantId: {
			type: DataTypes.INTEGER
		},
		placeId: {
			type: DataTypes.INTEGER
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}, {
		tableName: 'votes',
		timestamps: false
	})

	return Vote
}