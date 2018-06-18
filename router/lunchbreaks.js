const express = require('express')
const router = express.Router()
const Lunchbreak = require('./../models').Lunchbreak
const Comment = require('./../models').Comment
const Participant = require('./../models').Participant
const Vote = require('./../models').Vote
const Place = require('./../models').Place
const User = require('./../models').User
const Group = require('./../models').Group
const Util = require('./../util/util')
const Sec = require('./../util/sec')

// Liefert alle Lunchbreaks der Gruppen des Users
router.route('/').get((req, res) => {
	Lunchbreak.findAll({
		where: {
			groupId: {
				in: Util.getGroupIds(req.user, false)
			}
		}
	})
	.then(lunchbreaks => {
		res.send(lunchbreaks)
	})
	.catch(err => {
		res.status(500).send(err)
	})
})

loadGroupConfiguration = async function (req, res, next) {
	let group
	try {
		group = await Lunchbreak.findOne({
			where: {
				id: req.params.lunchbreakId
			},
			include: [ Group ]
		})
		.then(lunchbreak => {
			return lunchbreak.group.toJSON()
		})

		res.locals.groupConfiguration = group
		next()
	} catch (error) {
		console.log('loadGroupConfiguration() failed: ' + error)
		res.status(500).send()
	}
}

checkVotes = function (req, res, next) {
	let votes = req.body.votes
	
	// Hat jeder Vote eine zulässige Punktezahl? (Zwischen minPointsPerVote und maxPointsPerVote)
	let minPointsPerVote = res.locals.groupConfiguration.minPointsPerVote
	let maxPointsPerVote = res.locals.groupConfiguration.maxPointsPerVote

	if (!Util.pointsInRange(votes, minPointsPerVote, maxPointsPerVote)) {
		res.status(400).send('Points are not in between ' + minPointsPerVote + ' and ' + maxPointsPerVote)
		return
	} 

	// Liegt die Gesamtpunktzahl zwischen den Werten 1 und pointsPerDay?
	let pointsPerDay = res.locals.groupConfiguration.pointsPerDay
	let pointSum = Util.getPointSum(votes)
	if (!(pointSum >= 1 && pointSum <= pointsPerDay)) {
		res.status(400).send('Sum of points has to be between 1 and ' + pointsPerDay)
		return
	}

	next()
}

router.use('/:lunchbreakId*', [Sec.userHasAccessToLunchbreak, loadGroupConfiguration])

router.route('/:lunchbreakId').get((req, res) => {
	Lunchbreak.findOne({
		where: {
			groupId: {
				and: {
					eq: req.params.lunchbreakId,
					in: Util.getGroupIds(req.user, false)
				}
			}
		}
	})
	.then(lunchbreak => {
		if (lunchbreak) {
			res.send(lunchbreak)
		} else {
			res.status(400).send()
		}
	})
	.catch(err => {
		console.log(err)
		res.status(500).send(err)
	})
})

router.route('/:lunchbreakId/participants').get((req, res) => {
	Participant.findAll({
		where: {
			lunchbreakId: req.params.lunchbreakId
		},
		attributes: {
			exclude: ['amountSpent', 'userId']
		},
		include: [ 
			{
				model: User
			},
			{
				model: Vote,
				attributes: {
					exclude: ['id', 'participantId', 'placeId']
				},
				include: [ 
					{
						model: Place,
						attributes: {
							exclude: ['id', 'groupId']
						}
					} 
				]
			} 
		]
	})
	.then(participants => {
		res.send(participants)
	})
	.catch(err => {
		res.status(500).send(err)
	})
})

router.route('/:lunchbreakId/participants/:participantId').get((req, res) => {
	Participant.findOne({
		where: {
			id: req.params.participantId
		},
		include: [ 
			{
				model: User
			},
			{
				model: Vote,
				attributes: {
					exclude: ['id', 'participantId', 'placeId']
				},
				include: [ 
					{
						model: Place,
						attributes: {
							exclude: ['id', 'groupId']
						}
					} 
				]
			}
		]
	})
	.then(participant => {
		res.send(participant)
	})
})

router.route('/:lunchbreakId/participants/:participantId/votes').get((req, res) => {
	Vote.findAll({
		where: {
			participantId: req.params.participantId
		},
		attributes: {
			exclude: ['id', 'participantId', 'placeId']
		},
		include: [ 
			{
				model: Place,
				attributes: {
					exclude: ['id', 'groupId']
				}
			} 
		]
	})
	.then(votes => {
		res.send(votes)
	})
})

router.route('/:lunchbreakId/participants/:participantId/votes').post(checkVotes, async function (req, res) {
	// TODO: Check foreign key constraints (placeId)

	let votes = req.body.votes
	try {
		// 1. Delete all votes of this participant
		await Vote.destroy({
			where: {
				participantId: req.params.participantId
			}
		})

		// 2. Add the participantId to all votes
		for (let vote of votes) {
			vote.participantId = req.params.participantId
		}

		// 3. Create all votes
		await Vote.bulkCreate(votes)
		
		res.status(204).send()

	} catch (error) {
		console.log(error)
		res.status(500).send()
	}
})

router.route('/:lunchbreakId/comments').get((req, res) => {
	Comment.findAll({
		where: {
			lunchbreakId: req.params.lunchbreakId
		},
		attributes: {
			exclude: ['lunchbreakId', 'groupId', 'userId']
		},
		include: [ User ]
	})
	.then(comments => {
		res.send(comments)
	})
	.catch(err => {
		res.send(err)
	})
})



module.exports = router