const express = require('express')
const router = express.Router()
const Lunchbreak = require('./../models').Lunchbreak
const Comment = require('./../models').Comment
const Participant = require('./../models').Participant
const Vote = require('./../models').Vote
const Place = require('./../models').Place
const User = require('./../models').User
const Util = require('./../util/util')
const Sec = require('./../util/sec')
const LunchbreakMiddleware = require('./../middleware/lunchbreaks')

// Liefert alle Lunchbreaks der Gruppen des Users
router.route('/').get((req, res, next) => {
	Lunchbreak.findAll({
		where: {
			groupId: {
				in: Util.getGroupIds(res.locals.user, false)
			}
		}
	})
	.then(lunchbreaks => {
		res.send(lunchbreaks)
	})
	.catch(err => {
		next(err)
	})
})

router.use('/:lunchbreakId*', [Sec.userHasAccessToLunchbreak, LunchbreakMiddleware.loadGroupInfoByLunchbreakId])

router.route('/:lunchbreakId').get((req, res, next) => {
	Lunchbreak.findOne({
		where: {
			groupId: {
				and: {
					eq: req.params.lunchbreakId,
					in: Util.getGroupIds(res.locals.user, false)
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
		next(err)
	})
})

router.route('/:lunchbreakId/participants').get((req, res, next) => {
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
		next(err)
	})
})

router.route('/:lunchbreakId/participants/:participantId').get((req, res, next) => {
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
	.catch(err => {
		next(err)
	})
})

router.route('/:lunchbreakId/participants/:participantId/votes').get((req, res, next) => {
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
	.catch(err => {
		next(err)
	})
})

router.route('/:lunchbreakId/participants/:participantId/votes').post(LunchbreakMiddleware.checkVotes, async function (req, res, next) {
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
		next(error)
	}
})

router.route('/:lunchbreakId/comments').get((req, res, next) => {
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
		next(err)
	})
})

module.exports = router