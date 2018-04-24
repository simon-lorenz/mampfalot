const Sequelize = require('sequelize');
const sequelize = require('./../sequelize')
const User = require('./user')
const Place = require('./place')

const Vote = sequelize.define('votes', 
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        placeId: {
            type: Sequelize.INTEGER,
            foreignKey: true
        },
        points: {
            type: Sequelize.INTEGER,
            require: true,
        },
        userId: {
            type: Sequelize.INTEGER,
            foreignKey: true
        },
        date: {
            type: Sequelize.DATEONLY
        }
    }, 
    {
     timestamps: false,
     freezeTableName: true
    }
)

Vote.belongsTo(Place, { foreignKey: 'placeId' })
Vote.belongsTo(User, { foreignKey: 'userId' })

module.exports = Vote