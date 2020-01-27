'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')

router.route('/').all(allowMethods(['GET']))
router.route('/:username').all(allowMethods(['POST', 'DELETE']))

router.route('/').get(asyncMiddleware(async (req, res, next) => {
	const { groupId } = req.params
	const { InvitationController } = res.locals.controllers
	res.send(await InvitationController.getInvitations(groupId))
}))

router.route('/:username').post(asyncMiddleware(async (req, res, next) => {
	const { groupId, username } = req.params
	const { InvitationController } = res.locals.controllers
	res.status(201).send(await InvitationController.inviteUser(groupId, username))
}))

router.route('/:username').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId, username } = req.params
	const { InvitationController } = res.locals.controllers
	await InvitationController.withdrawInvitation(groupId, username)
	res.status(204).send()
}))

module.exports = router
