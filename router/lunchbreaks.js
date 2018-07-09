const express = require('express')
const router = express.Router()
const Comment = require('./../models').Comment
const Participant = require('./../models').Participant
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

router.route('/:lunchbreakId/comments').get((req, res, next) => {
	res.send(res.locals.lunchbreak.comments)
})

router.route('/:lunchbreakId/comments').post((req, res, next) => {
	Comment.create({
		lunchbreakId: res.locals.lunchbreak.id,
		userId: res.locals.user.id,
		comment: req.body.comment
	})
	.then(comment => {
		res.send(comment)
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

module.exports = router