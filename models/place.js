module.exports = (sequelize, DataTypes) => {
	const Place = sequelize.define('Place', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		groupId: {
			type: DataTypes.INTEGER
		},
		foodTypeId: {
			type: DataTypes.STRING
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
		timestamps: false
	})

	Place.associate = function (models) {
		models.Place.belongsTo(models.Group)
	}
	
	return Place
}