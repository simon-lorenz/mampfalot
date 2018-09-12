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
				notEmpty: {
					args: true,
					msg: 'type cannot be empty.'
				},
				notNull: {
					args: true,
					msg: 'type cannot be null.'
				}
			},
			unique: {
				name: 'compositeIndex',
				msg: 'This type already exists for this group.'
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
		models.FoodType.belongsTo(models.Group, { foreignKey: { unique: 'compositeIndex', allowNull: false }, onDelete: "CASCADE", hooks: true })
		models.FoodType.hasMany(models.Place)
	}

	return FoodType
}