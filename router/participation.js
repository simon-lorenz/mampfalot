'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')

router.route('/').all(allowMethods(['POST', 'DELETE']))
router.post('/', hasBodyValues(['amountSpent', 'result', 'votes'], 'all'))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	const participation = req.body
	const { ParticipationController } = res.locals.controllers
	res.status(201).send(await ParticipationController.createParticipation(groupId, date, participation))
}))

router.route('/').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	const { ParticipationController } = res.locals.controllers
	res.status(204).send(await ParticipationController.deleteParticipation(groupId, date))
}))

module.exports = router
