module.exports = (sequelize, DataTypes) => {
	const Invitation = sequelize.define(
		'Invitation',
		{
			groupId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				onDelete: 'CASCADE',
				unique: 'inviteOnce'
			},
			fromId: {
				type: DataTypes.INTEGER,
				allowNull: true,
				onDelete: 'SET NULL'
			},
			toId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				onDelete: 'CASCADE',
				unique: {
					name: 'inviteOnce',
					msg: 'This user is already invited.'
				}
			}
		},
		{
			tableName: 'invitations',
			timestamps: true,
			name: {
				singular: 'invitation',
				plural: 'invitations'
			}
		}
	)

	Invitation.associate = models => {
		models.Invitation.belongsTo(models.Group, { foreignKey: 'groupId' })
		models.Invitation.belongsTo(models.User, { as: 'from', foreignKey: 'fromId' })
		models.Invitation.belongsTo(models.User, { as: 'to', foreignKey: 'toId' })
	}

	return Invitation
}
