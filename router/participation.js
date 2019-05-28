'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const ParticipationController = require('../controllers/participation-controller')
const user = require('../classes/user')

router.route('/').all(allowMethods(['POST', 'DELETE']))
router.post('/', hasBodyValues(['amountSpent', 'result', 'votes'], 'all'))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	res.send('TODO')
}))

router.route('/').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	res.status(204).send(await ParticipationController.deleteParticipation(groupId, date))
}))

router.route('/:participantId/votes').get(asyncMiddleware(async (req, res, next) => {
	const { participant } = res.locals

	await user.can.readParticipant(participant)
	res.send(participant.votes)
}))

module.exports = router
