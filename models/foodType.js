const Sequelize = require('sequelize')
const sequelize = require('./../sequelize')

const FoodType = sequelize.define('foodTypes', 
    {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        type: {
            type: Sequelize.STRING
        }
    }, 
    {
     timestamps: false,
     freezeTableName: true
    }
);

module.exports = FoodType