module.exports = (sequelize, DataTypes) => {
	const Participant = sequelize.define('Participant', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
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
		name: {
			singular: 'participant',
			plural: 'participants'
		},
		defaultScope: {
			attributes: {
				exclude: ['amountSpent']
			}
		}
	})

	Participant.associate = function (models) {
		// models.Participant.belongsTo(models.Lunchbreak)
		// models.Participant.hasMany(models.Vote)
	}

	return Participant
}