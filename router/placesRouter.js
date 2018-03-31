const express = require('express')
const router = express.Router()
const Place = require('./../models/place')
const FoodType = require('./../models/foodType')

router.route('/').get((req, res) => {
    Place.findAll({
        attributes: {
            exclude: ['foodTypeId']
        },
        order: [
            ['id', 'ASC']
        ],
        include: [
            {
                model: FoodType
            }
        ]
    })
    .then(result => {
        res.send(result)
    })
    .catch(error => {
        res.status(400).send('Ein Fehler ist aufgetreten' + error)
    })
});

module.exports = router