module.exports = (sequelize, DataTypes) => {
	const Place = sequelize.define('Place', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		}
	}, {
		tableName: 'places',
		timestamps: false,
		name: {
			singular: 'place',
			plural: 'places'
		}
	})

	Place.associate = function (models) {
		models.Place.belongsTo(models.FoodType)
		models.Place.belongsTo(models.Group, { onDelete: 'CASCADE' })
	}

	return Place
}