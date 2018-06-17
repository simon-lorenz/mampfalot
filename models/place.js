module.exports = (sequelize, DataTypes) => {
	const Place = sequelize.define('Place', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
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
		timestamps: false
	})

	Place.associate = function (models) {
		// models.Place.belongsTo(models.Group, { foreignKey: 'placeId' })
		// models.Place.hasOne(models.FoodType)
	}
	
	return Place
}