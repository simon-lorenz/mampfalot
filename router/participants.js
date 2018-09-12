const router = require('express').Router()
const { allowMethods } = require('../util/middleware')
const { Participant, Vote, Place, User, Lunchbreak } = require('../models')
const { NotFoundError } = require('../classes/errors')
const { asyncMiddleware } = require('../util/util')

router.route('/:participantId').all(allowMethods(['GET', 'DELETE']))
router.route('/:participantId/votes').all(allowMethods(['GET']))

router.param('participantId', asyncMiddleware(async (req, res, next) => {
	let participantId = parseInt(req.params.participantId)

	res.locals.participant = await Participant.findOne({
		attributes: {
			exclude: ['amountSpent']
		},
		where: {
			id: participantId
		},
		include: [
			{
				model: Vote,
				include: [Place]
			}, User, Lunchbreak ]
	})

	if (res.locals.participant) {
		next()
	} else {
		next(new NotFoundError('Participant', participantId))
	}
}))

router.route('/:participantId').get(asyncMiddleware(async (req, res, next) => {
	let { participant, user } = res.locals

	await user.can.readParticipant(participant)
	res.send(participant)
}))

router.route('/:participantId').delete(asyncMiddleware(async (req, res, next) => {
	let { participant, user } = res.locals

	await user.can.deleteParticipant(participant)
	await participant.destroy()
	res.status(204).send()
}))

router.route('/:participantId/votes').get(asyncMiddleware(async (req, res, next) => {
	let { participant, user } = res.locals

	await user.can.readParticipant(participant)
	res.send(participant.votes)
}))

module.exports = router
