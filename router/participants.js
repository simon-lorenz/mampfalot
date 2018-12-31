'use strict'

const router = require('express').Router()
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const loader = require('../classes/resource-loader')

router.route('/:participantId').all(allowMethods(['GET', 'DELETE']))
router.route('/:participantId/votes').all(allowMethods(['GET']))

router.param('participantId', asyncMiddleware(loader.loadParticipant))

router.route('/:participantId').get(asyncMiddleware(async (req, res, next) => {
	const { participant, user } = res.locals

	await user.can.readParticipant(participant)
	res.send(participant)
}))

router.route('/:participantId').delete(asyncMiddleware(async (req, res, next) => {
	const { participant, user } = res.locals

	await user.can.deleteParticipant(participant)
	await participant.destroy()
	res.status(204).send()
}))

router.route('/:participantId/votes').get(asyncMiddleware(async (req, res, next) => {
	const { participant, user } = res.locals

	await user.can.readParticipant(participant)
	res.send(participant.votes)
}))

module.exports = router
