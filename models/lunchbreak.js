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
			unique: {
				name: 'lb_composite_index',
				msg: 'A lunchbreak at this date already exists.'
			}
		},
		lunchTime: {
			type: DataTypes.TIME,
			allowNull: false
		},
		voteEndingTime: {
			type: DataTypes.TIME,
			allowNull: false,
			validate: {
				compareWithLunchTime(value) {
					if (value > this.lunchTime) {
						throw 'voteEndingTime cannot be greater than lunchTime.'
					}
				}
			}
		}
	}, {
		tableName: 'lunchbreaks',
		timestamps: false,
		name: {
			singular: 'lunchbreak',
			plural: 'lunchbreaks'
		}
	})

	Lunchbreak.associate = function (models) {
		models.Lunchbreak.belongsTo(models.Group, { onDelete: 'cascade', foreignKey: { unique: 'lb_composite_index' } })
		models.Lunchbreak.hasMany(models.Comment, { onDelete: 'cascade' })
		models.Lunchbreak.hasMany(models.Participant, { onDelete: 'cascade' })
		models.Lunchbreak.belongsTo(models.Place, { foreignKey: { name: 'result', allowNull: true }})
	}

	return Lunchbreak
}