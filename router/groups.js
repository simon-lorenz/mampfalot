'use strict'

const router = require('express').Router()
const { Place } = require('../models')
const { allowMethods, hasBodyValues, convertParamToNumber } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const user = require('../classes/user')
const GroupController = require('../controllers/group-controller')
const PlaceRouter = require('./places')
const LunchbreakRouter = require('./lunchbreaks')
const GroupMemberRouter = require('./group-members')
const InvitationRouter = require('./invitiations')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['name'], 'all'))
router.route('/:groupId').all(allowMethods(['GET', 'PUT', 'DELETE']))
router.route('/:groupId').put(hasBodyValues(['name', 'lunchTime', 'voteEndingTime', 'utcOffset', 'pointsPerDay', 'maxPointsPerVote', 'minPointsPerVote'], 'atLeastOne'))

router.use('/:groupId/members', GroupMemberRouter)
router.use('/:groupId/invitations', InvitationRouter)

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const values = req.body
	res.status(201).send(await GroupController.createGroup(values))
}))

router.param('groupId', convertParamToNumber('groupId'))

router.route('/:groupId').get(asyncMiddleware(async (req, res, next) => {
	const { groupId } = req.params
	res.send(await GroupController.getGroupById(groupId))
}))

router.route('/:groupId').put(asyncMiddleware(async (req, res, next) => {
	const { groupId } = req.params
	const values = req.body
	res.send(await GroupController.updateGroup(groupId, values))
}))

router.route('/:groupId').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId } = req.params
	await GroupController.deleteGroup(groupId)
	res.status(204).send()
}))

router.use('/:groupId/places', PlaceRouter)

router.use('/:groupId/lunchbreaks', LunchbreakRouter)

router.route('/:groupId/places').get((req, res) => {
	res.send(res.locals.group.places)
})

router.route('/:groupId/places').post(asyncMiddleware(async (req, res, next) => {
	const place = Place.build({
		groupId: parseInt(req.params.groupId),
		foodType: req.body.foodType,
		name: req.body.name
	})

	await user.can.createPlace(place)
	res.status(201).send(await place.save())
}))

module.exports = router
