'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')

router.route('/:username').all(allowMethods(['PUT', 'DELETE']))

router.route('/:username').put(asyncMiddleware(async (req, res, next) => {
	const { groupId, username } = req.params
	const { GroupMemberController } = res.locals.controllers
	res.send(await GroupMemberController.updateMember(groupId, username, req.body))
}))

router.route('/:username').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId, username } = req.params
	const { GroupMemberController } = res.locals.controllers
	await GroupMemberController.removeMember(groupId, username)
	res.status(204).send()
}))

module.exports = router
