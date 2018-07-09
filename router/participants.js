const express = require('express')
const router = express.Router()
const middleware = require('../middleware/participant')

router.param('participantId', middleware.loadParticipant)

router.route('/:participantId').get((req, res, next) => {
	res.send(res.locals.participant)
})

router.route('/:participantId/votes').get((req, res, next) => {
	res.send(res.locals.participant.votes)
})

module.exports = router