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

router.route('/:placeId').put(util.isAdmin, (req, res) => {
    let placeId = req.params.placeId

    let updateData = {}
    if (req.body.name) { updateData.name = req.body.name.trim() }
    if (req.body.foodTypeId) { updateData.foodTypeId = req.body.foodTypeId }

    if (Object.keys(updateData).length === 0) {
        res.status(400).send({ error: 'Request needs to have at least one of the following parameters: name or foodTypeId' })
        return
    }

    Place.update(updateData, {
        where: {
            id: placeId
        }
    })
    .then(result => {
        res.send({ success: true })
    })
    .catch(err => {
        res.status(500).send(err)
    })
})

router.route('/:placeId').delete(util.isAdmin, (req,  res) => {
    Place.destroy({
        where: {
            id: req.params.placeId
        }
    })
    .then(result => {
        if (result == 0) {
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