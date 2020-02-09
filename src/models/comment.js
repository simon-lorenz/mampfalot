module.exports = (sequelize, DataTypes) => {
	const Comment = sequelize.define(
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
				allowNull: false,
				validate: {
					notEmpty: {
						args: true,
						msg: 'text cannot be empty.'
					},
					notNull: {
						args: true,
						msg: 'text cannot be null.'
					}
				}
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

	Comment.associate = models => {
		models.Comment.belongsTo(models.GroupMembers, { foreignKey: 'memberId', as: 'author' })
	}

	return Comment
}
