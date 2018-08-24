const express = require('express')
const router = express.Router()
const Vote = require('./../models').Vote
const middleware = require('../middleware/votes')
const Group = require('../models').Group
const Participant = require('../models').Participant
const Lunchbreak = require('../models').Lunchbreak
const Place = require('../models').Place

router.route('/').post(async (req, res, next) => {
	let votes = req.body
	let sum = 0

	// Conformity check
	// Does each vote ...
	// ... have the same participantId?
	// ... have all necessary parameters?
	let participantId
	for (vote of votes) {
		if (!(vote.participantId && vote.placeId && vote.points)) {
			res.status(400).send('Missing parameter')
			return
		}

		if (!participantId) {
			participantId = vote.participantId
		} else {
			if (participantId !== vote.participantId) {
				res.status(400).send('You may only create votes for one participant at a time')
				return
			}
		}
	}

	// Load participant data
	let participant = await	Participant.findOne({
		where: {
			id: participantId
		},
		include: [
			{
				model: Lunchbreak,
				include: [
					{
						model: Group,
						include: [ Place ]
					}
				]
			}
		]
	})

	// userId has to match participant.userId
	if(res.locals.user.id !== participant.userId) {
		res.status(403).send()
		return
	}

	let group = participant.lunchbreak.group

	// placeId-check
	let placeIds = []
	for (let vote of votes) {
		placeIds.push(vote.placeId)

		for (let i = 0; i < group.places.length; i++) {
			if (vote.placeId === group.places[i].id) {
				break
			}

			if (i === group.places.length - 1) {
				res.status(400).send('placeId does not belong to this group')
				return
			}
		}
	}

	for (let i = 0; i < placeIds.length; i++) {
		if (i !== placeIds.indexOf(placeIds[i])) {
			res.status(400).send('duplicate placeIds')
			return
		}
	}

	// points-check
	for (let vote of votes) {
		if (vote.points > group.maxPointsPerVote || vote.points < group.minPointsPerVote) {
			res.status(400).send('Invalid point number')
			return
		}

		sum += parseInt(vote.points)
	}

	if (sum > group.pointsPerDay) {
		res.status(400).send('Sum of points exceeded pointsPerDay limit')
		return
	}

	try {
		await Vote.destroy({
			where: {
				participantId: participantId
			}
		})

		await Vote.bulkCreate(votes)

		let newVotes = await Vote.findAll({
			where: {
				participantId
			},
			include: [ Participant, Place ]
		})

		res.send(newVotes)

	} catch (error) {
		next(error)
	}
})

router.param('voteId', middleware.loadVote)

router.route('/:voteId').get((req, res) => {
	res.send(res.locals.vote)
})

router.route('/:voteId').delete((req, res) => {
	res.locals.vote.destroy()
	.then(() => {
		res.status(204).send()
	})
	.catch(err => {
		next(err)
	})
})

module.exports = router