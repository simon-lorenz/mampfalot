const express = require('express')
const router = express.Router()
const Vote = require('./../models').Vote
const middleware = require('../middleware/votes')

router.route('/').post((req, res, next) => {
	Vote.create({
		participantId: req.body.participantId,
		placeId: req.body.placeId,
		points: req.body.points
	})
	.then(vote => {
		res.send(vote)
	})
	.catch(err => {
		next(err)
	})
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