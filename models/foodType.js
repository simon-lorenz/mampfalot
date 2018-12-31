'use strict'

module.exports = (sequelize, DataTypes) => {
	const FoodType = sequelize.define('FoodType', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		groupId: {
			type: DataTypes.INTEGER,
			unique: 'uniqueTypesPerGroup',
			allowNull: false,
			onDelete: 'CASCADE'
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
				name: 'uniqueTypesPerGroup',
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
		models.FoodType.belongsTo(models.Group, { foreignKey: 'groupId' })
		models.FoodType.hasMany(models.Place, { foreignKey: 'foodTypeId' })
	}

	return FoodType
}
