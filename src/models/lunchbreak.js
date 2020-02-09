module.exports = (sequelize, DataTypes) => {
	const Lunchbreak = sequelize.define(
		'Lunchbreak',
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			groupId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				onDelete: 'CASCADE',
				unique: 'oneLuchbreakPerDayPerGroup'
			},
			date: {
				type: DataTypes.DATEONLY,
				allowNull: false,
				unique: {
					name: 'oneLuchbreakPerDayPerGroup',
					msg: 'A lunchbreak at this date already exists.'
				}
			}
		},
		{
			tableName: 'lunchbreaks',
			timestamps: false,
			name: {
				singular: 'lunchbreak',
				plural: 'lunchbreaks'
			}
		}
	)

	Lunchbreak.associate = models => {
		models.Lunchbreak.belongsTo(models.Group, { foreignKey: 'groupId' })
		models.Lunchbreak.hasMany(models.Comment, { foreignKey: 'lunchbreakId' })
		models.Lunchbreak.hasMany(models.Absence, { foreignKey: 'lunchbreakId' })
		models.Lunchbreak.hasMany(models.Participant, { foreignKey: 'lunchbreakId' })
	}

	return Lunchbreak
}
