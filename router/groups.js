'use strict'

const router = require('express').Router()
const { Place } = require('../models')
const { allowMethods, hasBodyValues, convertParamToNumber } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const user = require('../classes/user')
const GroupController = require('../controllers/group-controller')
const GroupMemberController = require('../controllers/group-member-controller')
const InvitationController = require('../controllers/invitation-controller')
const PlaceRouter = require('./places')
const LunchbreakRouter = require('./lunchbreaks')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['name'], 'all'))
router.route('/:groupId').all(allowMethods(['GET', 'PUT', 'DELETE']))
router.route('/:groupId').put(hasBodyValues(['name', 'lunchTime', 'voteEndingTime', 'utcOffset', 'pointsPerDay', 'maxPointsPerVote', 'minPointsPerVote'], 'atLeastOne'))
router.route('/:groupId/invitations').all(allowMethods(['GET']))
router.route('/:groupId/invitations/:username').all(allowMethods(['POST', 'DELETE']))
router.route('/:groupId/members').all(allowMethods(['GET']))
router.route('/:groupId/members/:username').all(allowMethods(['PUT', 'DELETE']))

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

router.route('/:groupId/invitations').get(asyncMiddleware(async (req, res, next) => {
	const { groupId } = req.params
	res.send(await InvitationController.getInvitations(groupId))
}))

router.route('/:groupId/invitations/:username').post(asyncMiddleware(async (req, res, next) => {
	const { groupId, username } = req.params
	res.status(201).send(await InvitationController.inviteUser(groupId, username))
}))

router.route('/:groupId/invitations/:username').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId, username } = req.params
	await InvitationController.withdrawInvitation(groupId, username)
	res.status(204).send()
}))

router.route('/:groupId/members/:username').put(asyncMiddleware(async (req, res, next) => {
	const { groupId, username } = req.params
	res.send(await GroupMemberController.updateMember(groupId, username, req.body))
}))

router.route('/:groupId/members/:username').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId, username } = req.params
	await GroupMemberController.removeMember(groupId, username)
	res.status(204).send()
}))

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
