const express = require('express')
const router = express.Router()
const Vote = require('./../models/vote')
const User = require('./../models/user')
const Place = require('./../models/place')
const Util = require('./../util/util')

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

router.route('/').post(async function(req, res) {
    let vote = {
        userId: parseInt(req.body.userId),
        placeId: parseInt(req.body.placeId),
        date: new Date(),
        points: parseInt(req.body.points)
    }

    let missingValues = Util.missingValues(vote)
    if (missingValues.length > 0) {
        res.status(400).send({ missingValues })
        return
    }
    
    if (!Util.pointsInRange(vote.points)) {
        res.status(400).send('Points not in range (1-100)')
        return
    }

    let pointsToday = await getPointsToday(vote.userId)
    if ((pointsToday + vote.points) > 100) {
        res.status(400).send('Sum of all points should be between 1 and 100 but was ' + (pointsToday + vote.points))
        return
    }

    let placesToday = await getPlacesToday(vote.userId)
    if (placesToday.includes(vote.placeId)) {
        res.status(400).send('User has already voted for this placeId!')
        return
    }
    
    if (vote.userId != req.user.id) {
        res.status(403).send()
        return
    }

    Vote.create(
        vote
    )
    .then(result => {
        res.send()
    })
    .catch(error => {
        console.log(error)
        res.status(500).send('Something went wrong.')
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

router.route('/today/:userId').get((req, res) => {
    let userId = req.params.userId

    if (isNaN(userId)) {
        res.status(400).send({ error: 'Numeric value expected' })
        return
    }

    Vote.findAll({
        attributes: {
            exclude: ['placeId', 'userId']
        },
        where: {
            date: new Date(),
            userId: req.params.userId
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
        res.status(500).send(error)
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

getPlacesToday = function (userId) {
    return Vote.findAll({
        where: {
            userId,
            date: new Date()
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

getPointsToday = function (userId) {
    return Vote.findAll({
        where: {
            userId,
            date: new Date()
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

module.exports = router