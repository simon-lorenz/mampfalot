const express = require('express')
const router = express.Router()
const FoodType = require('./../models/foodType')
const util = require('./../util/util')

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

router.route('/').post(util.isAdmin, (req, res) => {
    let foodType = {
        type: req.body.type
    }

    let missingValues = util.missingValues(foodType)
    if (missingValues.length > 0) {
        res.status(400).send({ missingValues })
        return
    }

    FoodType.create(foodType)
    .then(result => {
        res.send(result)
    })
    .catch(error => {
        console.log(error)
        res.status(500).send('Something went wrong.')
    })
})

module.exports = router