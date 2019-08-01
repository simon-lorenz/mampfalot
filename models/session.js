'use strict'

module.exports = (sequelize, DataTypes) => {
	const Session = sequelize.define('Session', {
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			onDelete: 'CASCADE'
		},
		token: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true
		},
		expiresAt: {
			type: DataTypes.DATE,
			allowNull: true
		},
		lastUse: {
			type: DataTypes.DATE,
			allowNull: true
		}
	}, {
		tableName: 'sessions',
		timestamps: true,
		name: {
			singular: 'session',
			plural: 'sessions'
		}
	})

	Session.associate = (models) => {
		models.Session.belongsTo(models.User, { foreignKey: 'userId' })
	}

	return Session
}
