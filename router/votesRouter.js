const express = require('express')
const router = express.Router()
const Vote = require('./../models/vote')
const User = require('./../models/user')
const Place = require('./../models/place')

router.route('/').get((req, res) => {
    Vote.findAll({
        attributes: {
            exclude: ['placeId', 'userId']
        },
        order: [
            ['id', 'ASC']
        ],
        include: [
            {
                model: User,
                attributes: {
                    exclude: ['isAdmin', 'password']
                }
            },
            {
                model: Place
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

router.route('/today').get((req, res) => {
    Vote.findAll({
        attributes: {
            exclude: ['placeId', 'userId']
        },
        where: {
            date: new Date()
        },
        order: [
            ['id', 'ASC']
        ],
        include: [
            {
                model: User,
                attributes: {
                    exclude: ['isAdmin', 'password']
                }
            },
            {
                model: Place
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

router.route('/today').post((req, res) => {
    let placeId = req.body.placeId

    if(!req.body.placeId) {
        res.status(400).send({success: false, error: { missingValues: ['placeId'] }})
        return;
    }

    // Checke zuerst, ob der User heute schon gevoted hat
    Vote.findOne({
        where: {
            userId: req.user.id,
            date: new Date()
        }
    })
    .then(result => {
        if(result) {
            // Der User hat schon einmal gevoted, updaten
            Vote.update(
                { placeId: req.body.placeId },
                { where: { id: result.id } }
            )
            .then(result => {
                res.send({success: true, type: 'updated'})
            })
            .catch(error => {
                res.status(400).send({ success: false, error })
            })
        } else {
            // Der User hat noch nicht gevoted
            Vote.insertOrUpdate({
                placeId: req.body.placeId,
                userId: req.user.id,
                date: new Date()
            })
            .then(result => {
                res.send({ success: true, type: 'inserted' })
            })
            .catch(error => {
                res.status(500).send({ success: false, error })
            })
        }
    })    
})

module.exports = router