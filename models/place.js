module.exports = (sequelize, DataTypes) => {
	const Place = sequelize.define('Place', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		foodTypeId: {
			type: DataTypes.INTEGER,
			validate: {
				async belongsToGroup(val) {
					let FoodType = sequelize.models.FoodType
					let foodType = await FoodType.findById(val)

					if (foodType.groupId !== this.groupId) {
						throw 'This food type does not belong to group ' + this.groupId
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
		models.Place.hasMany(models.Vote, { onDelete: 'CASCADE' })
		models.Place.belongsTo(models.FoodType)
		models.Place.belongsTo(models.Group, { onDelete: 'CASCADE' })
	}

	return Place
}