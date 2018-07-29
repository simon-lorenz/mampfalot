const express = require('express')
const router = express.Router()
const middleware = require('../middleware/participant')
const commonMiddleware = require('../middleware/common')

router.param('participantId', middleware.loadParticipant)

router.route('/:participantId').all((req, res, next) => {
	if (!res.locals.user.isGroupMember(res.locals.participant.lunchbreak.groupId)) {
		res.status(403).send()
	} else {
		next()
	}
})

router.route('/:participantId').get((req, res, next) => {
		res.send(res.locals.participant)
})

router.route('/:participantId').delete(middleware.userIsParticipant, (req, res, next) => {
	res.locals.participant.destroy()
	.then(() => {
		res.status(204).send()
	})
	.catch(err => {
		next(err)
	})
})

router.route('/:participantId/votes').get((req, res, next) => {
	res.send(res.locals.participant.votes)
})

module.exports = router