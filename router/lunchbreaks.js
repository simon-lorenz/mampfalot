const express = require('express')
const router = express.Router()
const Lunchbreak = require('./../models').Lunchbreak
const Comment = require('./../models').Comment
const Participant = require('./../models').Participant
const Vote = require('./../models').Vote
const Place = require('./../models').Place
const User = require('./../models').User
const middleware = require('./../middleware/lunchbreaks')

router.param('lunchbreakId', middleware.loadLunchbreak)

router.route('/:lunchbreakId').get((req, res, next) => {
	res.send(res.locals.lunchbreak)
})

router.route('/:lunchbreakId').post((req, res, next) => {
	if(!res.locals.user.isGroupAdmin(res.locals.lunchbreak.groupId)) {
		res.status(403).send()
		return
	}

	let values = {}
	if(req.body.voteEndingTime) { values.voteEndingTime = req.body.voteEndingTime }
	if(req.body.lunchTime) { values.lunchTime = req.body.lunchTime }

	if (Object.keys(values).length === 0) {
		res.status(400).send('Please provide at least one of the following parameter: voteEndingTime, lunchTime')
		return
	}

	res.locals.lunchbreak
		.update(values)
		.then((lunchbreak) => {
			res.send(lunchbreak)
		})
		.catch(err => {
			next(err)
		})
})

router.route('/:lunchbreakId/participants').get((req, res, next) => {
	res.send(res.locals.lunchbreak.participants)
})

router.route('/:lunchbreakId/participants').post((req, res, next) => {
	if (!req.body.userId) { 
		res.status(400).send('Please provide a userId')
		return
	}

	if (req.body.userId !== res.locals.user.id) {
		res.status(403).send()
		return
	}

	if (!res.locals.user.isGroupMember(res.locals.lunchbreak.groupId)) {
		res.status(403).send()
		return
	}

	Participant.create({
		userId: parseInt(req.body.userId),
		lunchbreakId: parseInt(req.params.lunchbreakId)
	})
	.then(participant => {
		res.send(participant)
	})
	.catch(err => {
		next(err)
	})
})

router.param('participantId', middleware.loadParticipant)

router.route('/:lunchbreakId/participants/:participantId').get((req, res, next) => {
	res.send(res.locals.participant)
})

router.route('/:lunchbreakId/participants/:participantId/votes').get((req, res, next) => {
	res.send(res.locals.participant.votes)
})

module.exports = router