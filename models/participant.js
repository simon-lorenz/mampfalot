module.exports = (sequelize, DataTypes) => {
	const Participant = sequelize.define('Participant', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
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
		}
	})

	Participant.associate = function (models) {
		models.Participant.belongsTo(models.User, {
			foreignKey: {
				unique: {
					name:'compositeIndex',
					msg: 'This user already participates.'
				},
				allowNull: false
			}
		})
		models.Participant.belongsTo(models.Lunchbreak, {
			foreignKey: {
				unique: {
					name:'compositeIndex',
					msg: 'This user already participates.'
				},
				allowNull: false
			}
		})
		models.Participant.hasMany(models.Vote, { onDelete: 'cascade' })
	}

	return Participant
}