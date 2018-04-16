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

router.route('/today').delete((req, res) => {
    let voteId = req.body.voteId

    // Pflichtangaben überprüfen
    if (!voteId) {
        res.status(400).send({ success: false, missingValues: 'voteId' })
        return
    }

    Vote.findOne({
        where: {
            id: voteId
        }
    })
    .then(result => {
        if (!result) {
            res.status(400).send({ success: false, error: 'Invalid voteId'})
            return
        } 
        
        // Admins dürfen alles löschen, User nur ihre eigenen Votes
        if (!req.user.isAdmin && (result.userId !== req.user.id)) {
            res.status(401).send({ success: false, error: 'Unauthorized'})
            return
        } 

        Vote.destroy({
            where: {
                id: voteId
            }
        })
        .then(() => {
            res.status(200).send({success: true})
        })
        .catch(err => {
            res.status(500).send({success: false})
        })     
    })
    .catch(error => {
        res.status(500).send(error)
    })
    
})

module.exports = router