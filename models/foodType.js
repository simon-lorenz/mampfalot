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
		timestamps: false,
		name: {
			singular: 'foodType',
			plural: 'foodTypes'
		}
	})

	FoodType.associate = function (models) {
		models.FoodType.belongsTo(models.Group, { foreignKey: 'groupId' })
		// models.FoodType.belongsTo(models.Group)
		models.FoodType.hasMany(models.Place, { foreignKey: 'foodTypeId' })
		// models.FoodType.hasOne(models.Place, { foreignKey: 'foodTypeId '})
	}

	return FoodType
}