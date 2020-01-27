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
			unique: {
				name: 'uniquePlacePerGroup',
				args: true,
				msg: 'A place with this name already exists.'
			},
			onDelete: 'CASCADE'
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: {
				name: 'uniquePlacePerGroup',
				args: true,
				msg: 'A place with this name already exists.'
			},
			validate: {
				notEmpty: {
					args: true,
					msg: 'name cannot be empty.'
				}
			}
		},
		foodType: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				notEmpty: {
					args: true,
					msg: 'foodType cannot be empty.'
				}
			}
		},
	}, {
		tableName: 'places',
		timestamps: false,
		name: {
			singular: 'place',
			plural: 'places'
		}
	})

	Place.associate = models => {
		models.Place.hasMany(models.Vote, { foreignKey: 'placeId' })
		models.Place.belongsTo(models.Group, { foreignKey: 'groupId' })
	}

	return Place
}
