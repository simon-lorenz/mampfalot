'use strict'

module.exports = (sequelize, DataTypes) => {
	const Comment = sequelize.define('Comment', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		lunchbreakId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE'
		},
		userId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL'
		},
		comment: {
			type: DataTypes.TEXT,
			allowNull: false,
			validate: {
				notEmpty: {
					args: true,
					msg: 'comment cannot be empty.'
				},
				notNull: {
					args: true,
					msg: 'comment cannot be null.'
				}
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
		models.Comment.belongsTo(models.Lunchbreak, { foreignKey: 'lunchbreakId' })
		models.Comment.belongsTo(models.User, { foreignKey: 'userId' })
	}

	return Comment
}
