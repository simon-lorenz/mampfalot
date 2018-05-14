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
            foreignKey: true,
            validate: {
                noDuplicates: async function (value) {
                    let placesToday = await getPlacesAtDay(this.userId, new Date())
                    if (placesToday.includes(value)) {
                        throw new Error ('User has already voted for this placeId!')
                    }
                }
            }
        },
        points: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: {
                min: 1, 
                max: 100,
                sumOfPointsInRange: async function (value) {
                    let pointsToday = await getPointsAtDate(this.userId, this.date)
                    if ((pointsToday + value) > 100) {
                        throw new Error ('Sum of all points should be between 1 and 100 but was ' + (pointsToday + value))
                    }
                }
            }
        },
        userId: {
            type: Sequelize.INTEGER,
            foreignKey: true
        },
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false
        }
    }, 
    {
        timestamps: false,
        freezeTableName: true
    }
)

Vote.belongsTo(Place, { foreignKey: 'placeId' })
Vote.belongsTo(User, { foreignKey: 'userId' })

getPointsAtDate = function (userId, date) {
    return Vote.findAll({
        where: {
            userId,
            date
        },
        raw: true
    })
    .then(votes => {
        let sum = 0
        votes.forEach((vote) => {
            sum += vote.points
        })
        return sum
    })
    .catch(error => {
        return error
    })
}

getPlacesAtDay = function (userId, date) {
    return Vote.findAll({
        where: {
            userId,
            date
        },
        raw: true
    })
    .then(votes => {
        let places = []
        votes.forEach((vote) => {
            places.push(vote.placeId)
        })
        return places
    })
    .catch(error => {
        return error
    })
}

module.exports = Vote