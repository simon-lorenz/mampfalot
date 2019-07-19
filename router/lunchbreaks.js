'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasQueryValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const ParticipationRouter = require('./participation')
const CommentRouter = require('./comments')

router.route('/').all(allowMethods(['GET', 'POST']))
router.route('/').get(hasQueryValues(['from', 'to'], 'all'))
router.route('/:date').all(allowMethods(['GET']))

router.route('/').get(asyncMiddleware(async (req, res, next) => {
	const { from, to } = req.query
	const { groupId } = req.params
	const { LunchbreakController } = res.locals.controllers
	res.send(await LunchbreakController.getLunchbreaks(groupId, from, to))
}))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	const { LunchbreakController } = res.locals.controllers
	res.status(201).send(await LunchbreakController.createLunchbreak(groupId, date))
}))

router.route('/:date').get(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	const { LunchbreakController } = res.locals.controllers
	res.send(await LunchbreakController.getLunchbreak(groupId, date))
}))

router.use('/:date/participation', ParticipationRouter)
router.use('/:date/comments', CommentRouter)

module.exports = router
