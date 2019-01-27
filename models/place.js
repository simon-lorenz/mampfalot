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
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		},
		foodType: {
			type: DataTypes.STRING,
			allowNull: false
		},
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
		models.Place.belongsTo(models.Group, { foreignKey: 'groupId' })
	}

	return Place
}
