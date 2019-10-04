'use strict'

module.exports = (sequelize, DataTypes) => {
	const Invitation = sequelize.define('Invitation', {
		groupId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			unique: 'inviteOnce'
		},
		fromId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			onDelete: 'SET NULL',
		},
		toId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE',
			unique: {
				name: 'inviteOnce',
				msg: 'This user is already invited.'
			},
			validate: {
				async notMemberOfGroup() {
					const { GroupMembers } = sequelize.models
					const member = await GroupMembers.findOne({
						where: {
							groupId: this.groupId,
							userId: this.toId
						}
					})
					if (member) throw new Error('This user is already a member of this group.')
				}
			}
		}
	}, {
		tableName: 'invitations',
		timestamps: true,
		name: {
			singular: 'invitation',
			plural: 'invitations'
		}
	})

	Invitation.associate = function (models) {
		models.Invitation.belongsTo(models.Group, { foreignKey: 'groupId' })
		models.Invitation.belongsTo(models.User, { as: 'from', foreignKey: 'fromId' })
		models.Invitation.belongsTo(models.User, { as: 'to', foreignKey: 'toId' })
	}

	return Invitation
}
