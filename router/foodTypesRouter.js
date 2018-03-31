const express = require('express')
const router = express.Router()
const FoodType = require('./../models/foodType')

router.route('/').get((req, res) => {
    FoodType.findAll({
        order: [
            ['id', 'ASC']
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