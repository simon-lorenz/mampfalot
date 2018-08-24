module.exports = (sequelize, DataTypes) => {
	const Lunchbreak = sequelize.define('Lunchbreak', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		date: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		lunchTime: {
			type: DataTypes.TIME,
			allowNull: false
		},
		voteEndingTime: {
			type: DataTypes.TIME,
			allowNull: false
		}
	}, {
		tableName: 'lunchbreaks',
		timestamps: false,
		name: {
			singular: 'lunchbreak',
			plural: 'lunchbreaks'
		},
		validate: {
			voteEndingTimeValid() {
				if (this.voteEndingTime > this.lunchTime) {
					throw 'voteEndingTime cannot be greater than lunchTime'
				}
			}
		}
	})

	Lunchbreak.associate = function (models) {
		models.Lunchbreak.belongsTo(models.Group)
		models.Lunchbreak.hasMany(models.Comment)
		models.Lunchbreak.hasMany(models.Participant)
		models.Lunchbreak.belongsTo(models.Place, { foreignKey: { name: 'result', allowNull: true }})
	}

	return Lunchbreak
}