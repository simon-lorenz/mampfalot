module.exports = (sequelize, DataTypes) => {
	const FoodType = sequelize.define('FoodType', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
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
		timestamps: false,
		name: {
			singular: 'foodType',
			plural: 'foodTypes'
		}
	})

	FoodType.associate = function (models) {
		models.FoodType.belongsTo(models.Group)
		models.FoodType.hasMany(models.Place)
	}

	return FoodType
}