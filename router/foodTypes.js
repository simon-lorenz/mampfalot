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

router.route('/:foodTypeId').get((req, res) => {
    FoodType.findOne({
        where: {
            id: req.params.foodTypeId
        }
    })
    .then(result => {
        if (!result) {
            res.status(404).send()
        } else {
            res.send(result)
        }
    })
})

router.route('/:foodTypeId').delete(util.isAdmin, (req, res) => {
    FoodType.destroy({
        where: {
            id: req.params.foodTypeId
        }
    })
    .then(result => {
        if (result === 0) {
            res.status(404).send()
        } else {
            res.send()
        }
    })
    .catch(error => {
        console.log(error)
        res.status(500).send('Something went wrong.')
    })
})

module.exports = router