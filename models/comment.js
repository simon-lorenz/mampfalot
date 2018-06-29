module.exports = (sequelize, DataTypes) => {
	const Comment = sequelize.define('Comment', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		comment: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: true
			}
		}
	}, {
		tableName: 'comments',
		timestamps: true,
		name: {
			singular: 'comment',
			plural: 'comments'
		}
	})

	Comment.associate = function (models) {
		models.Comment.belongsTo(models.Lunchbreak)
		models.Comment.belongsTo(models.User)
	}

	return Comment
}