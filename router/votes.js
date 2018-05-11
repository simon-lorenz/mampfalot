const express = require('express')
const router = express.Router()
const Vote = require('./../models/vote')
const User = require('./../models/user')
const Place = require('./../models/place')
const Util = require('./../util/util')

router.route('/').get((req, res) => {
    let where = {}

    if (req.query.date) {
        where.date = req.query.date
    }

    if (req.query.userId) {
        where.userId = req.query.userId
    }

    Vote.findAll({
        attributes: {
            exclude: ['placeId', 'userId']
        },
        where,
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

router.route('/').post(async function(req, res) {
    let vote = {
        userId: parseInt(req.body.userId),
        placeId: parseInt(req.body.placeId),
        date: new Date(),
        points: parseInt(req.body.points)
    }

    if (vote.userId != req.user.id) {
        res.status(403).send()
        return
    }

    Vote.create(vote)
    .then(result => {
        res.send()
    })
    .catch(error => {
        if (error.name === 'SequelizeValidationError') {
            res.status(400).send(error.errors)
        } else if (error.name === 'SequelizeForeignKeyConstraintError') {
            res.status(400).send('Foreign Key Error: ' + error.fields)
        } else {
            console.log(error)
            res.status(500).send(error)
        }
    })
})

router.route('/today').post((req, res) => {
    let votes = req.body.votes

    if (!votes || !votes.length) {
        res.status(400).send({ success: false, error: 'votes-array undefined or zero length'})
        return
    } 

    let allPoints = 0
    let placeIds = []
    let err

    for(let i = 0; i < votes.length; i++) {
        element = votes[i]
        if (!element.placeId || !element.points) {
            err = { success: false, error: 'vote-object misformed'}
            break
        } else if (!(element.points >= 1 && element.points <= 100)) {
            err = { success: false, error: 'points out of range'}
        }
        allPoints += element.points
        placeIds.push(element.placeId)
    }   

    if(err) {
        res.status(400).send(err)
        return
    }

    // Überprüfe, ob mehrfach die gleiche placeId angegeben wurde
    let duplicates = Util.findDuplicates(placeIds)
    if(duplicates.length > 0) {
        res.status(400).send({success: false, error: { duplicatePlaceIds: duplicates}})
        return
    }

    // Prüfe ob die Gesamtsumme der Punkte im zulässigen Bereich liegt
    if(!(allPoints >= 1 && allPoints <= 100)) {
        res.status(400).send({success: false, error: 'sum of points should be between 1-100 but was ' + allPoints})
        return
    }

    // Lösche alle heutigen Votes des Users
    Vote.destroy({
        where: {
            userId: req.user.id,
            date: new Date()
        }
    })
    .then(result => {
        // Votes um notwendige Daten ergänzen
        votes.forEach((element) => {
            element.userId = req.user.id,
            element.date = new Date()
        })

        // Speichere die neuen Votes
        Vote.bulkCreate(votes)
        .then(result => {
            res.send({success: true, result})
        })
        .catch(err => {
            res.status(500).send({success: false, error})
        })
    })
})

router.route('/:voteId').get((req, res) => {
    Vote.findOne({
        where: {
            id: req.params.voteId
        }
    })
    .then(result => {
        if (result) {
            res.send(result)
        } else {
            res.status(404).send()
        }
    })
    .catch(error => {
        console.log(error)
        res.status(500).send('Something went wrong.')
    })
})

router.route('/:voteId').delete((req, res) => {
    let voteId = req.params.voteId

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