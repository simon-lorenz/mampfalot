const { DataTypes } = require('sequelize')
const { sequelize } = require('../sequelize')

const CommentModel = sequelize.define(
	'Comment',
	{
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
		memberId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL'
		},
		text: {
			type: DataTypes.TEXT,
			allowNull: false
		}
	},
	{
		tableName: 'comments',
		timestamps: true,
		name: {
			singular: 'comment',
			plural: 'comments'
		}
	}
)

CommentModel.associate = models => {
	models.Comment.belongsTo(models.GroupMembers, { foreignKey: 'memberId', as: 'author' })
}

module.exports = CommentModel
