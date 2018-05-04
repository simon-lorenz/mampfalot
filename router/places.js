const express = require('express')
const router = express.Router()
const Place = require('./../models/place')
const FoodType = require('./../models/foodType')
const util = require('./../util/util')

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
})

router.use('/', util.isAdmin)
router.route('/').post((req, res) => {
    let place = {
        id: req.body.id,
        name: req.body.name,
        foodTypeId: req.body.foodTypeId
    }

    if (util.missingValues(place).length > 0) {
        res.status(400).send({ error: { missingValues: util.missingValues(place)}})
        return
    }

    Place.update(place, {
        where: {
            id: place.id
        }
    })
    .then(result => {
        res.send({ success: true })
    })
    .catch(err => {
        res.status(500).send(err)
    })
})

module.exports = router