const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')
const FoodType = require('./foodType')

const Place = sequelize.define('places', 
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        foodTypeId: {
            type: Sequelize.STRING,
            foreignKey: true
        },
        name: {
            type: Sequelize.STRING
        }
    }, 
    {
     timestamps: false,
     freezeTableName: true
    }
);

Place.belongsTo(FoodType, { foreignKey: 'foodTypeId' })

module.exports = Place