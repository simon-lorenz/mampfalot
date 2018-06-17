module.exports = (sequelize, DataTypes) => {
	const FoodType = sequelize.define('FoodType', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		}
	}, {
		tableName: 'food_types',
		timestamps: false
	})

	FoodType.associate = function (models) {
		// models.FoodType.belongsTo(models.Group)
	}

	return FoodType
}