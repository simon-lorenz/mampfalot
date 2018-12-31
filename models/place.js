'use strict'

module.exports = (sequelize, DataTypes) => {
	const Place = sequelize.define('Place', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		groupId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE'
		},
		foodTypeId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL',
			validate: {
				async belongsToGroup(val) {
					const FoodType = sequelize.models.FoodType
					const foodType = await FoodType.findByPk(val)

					if (foodType.groupId !== this.groupId) {
						throw new Error(`This food type does not belong to group ${this.groupId}`)
					}
				}
			}
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
		models.Place.hasMany(models.Vote, { foreignKey: 'placeId' })
		models.Place.belongsTo(models.FoodType, { foreignKey: 'foodTypeId' })
		models.Place.belongsTo(models.Group, { foreignKey: 'groupId' })
	}

	return Place
}
