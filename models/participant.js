module.exports = (sequelize, DataTypes) => {
	const Participant = sequelize.define('Participant', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		lunchbreakId: {
			type: DataTypes.INTEGER
		},
		userId: {
			type: DataTypes.INTEGER
		},
		amountSpent: {
			type: DataTypes.DECIMAL
		},
		lunchTimeSuggestion: {
			type: DataTypes.TIME
		}
	}, {
		tableName: 'participants',
		timestamps: false,
		defaultScope: {
			attributes: {
				exclude: ['amountSpent']
			}
		}
	})

	Participant.associate = function (models) {
		models.Participant.belongsTo(models.Lunchbreak)
		models.Participant.hasMany(models.Vote)
	}

	return Participant
}