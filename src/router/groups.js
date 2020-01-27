'use strict'

const router = require('express').Router()
const { allowMethods, hasBodyValues, convertParamToNumber } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const PlaceRouter = require('./places')
const LunchbreakRouter = require('./lunchbreaks')
const GroupMemberRouter = require('./group-members')
const InvitationRouter = require('./invitiations')

router.use('/:groupId/members', GroupMemberRouter)
router.use('/:groupId/invitations', InvitationRouter)
router.use('/:groupId/places', PlaceRouter)
router.use('/:groupId/lunchbreaks', LunchbreakRouter)

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['name'], 'all'))
router.route('/:groupId').all(allowMethods(['GET', 'PUT', 'DELETE']))
router.route('/:groupId').put(hasBodyValues(['name', 'lunchTime', 'voteEndingTime', 'utcOffset', 'pointsPerDay', 'maxPointsPerVote', 'minPointsPerVote'], 'atLeastOne'))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const values = req.body
	const { GroupController } = res.locals.controllers
	res.status(201).send(await GroupController.createGroup(values))
}))

router.param('groupId', convertParamToNumber('groupId'))

router.route('/:groupId').get(asyncMiddleware(async (req, res, next) => {
	const { groupId } = req.params
	const { GroupController } = res.locals.controllers
	res.send(await GroupController.getGroupById(groupId))
}))

router.route('/:groupId').put(asyncMiddleware(async (req, res, next) => {
	const { groupId } = req.params
	const values = req.body
	const { GroupController } = res.locals.controllers
	res.send(await GroupController.updateGroup(groupId, values))
}))

router.route('/:groupId').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId } = req.params
	const { GroupController } = res.locals.controllers
	await GroupController.deleteGroup(groupId)
	res.status(204).send()
}))

module.exports = router
