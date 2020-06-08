const { DataTypes } = require('sequelize')
const { sequelize } = require('../sequelize')

const PlaceModel = sequelize.define(
	'Place',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		groupId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			unique: {
				name: 'uniquePlacePerGroup',
				args: true
			},
			onDelete: 'CASCADE'
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: {
				name: 'uniquePlacePerGroup',
				args: true
			}
		},
		foodType: {
			type: DataTypes.STRING,
			allowNull: false
		}
	},
	{
		tableName: 'places',
		timestamps: false,
		name: {
			singular: 'place',
			plural: 'places'
		}
	}
)

PlaceModel.associate = models => {
	models.Place.hasMany(models.Vote, { foreignKey: 'placeId' })
	models.Place.belongsTo(models.Group, { foreignKey: 'groupId' })
}

module.exports = PlaceModel
