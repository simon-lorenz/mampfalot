'use strict'

const router = require('express').Router()
const { Comment, Participant } = require('../models')
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const loader = require('../classes/resource-loader')
const user = require('../classes/user')

router.route('/:lunchbreakId').all(allowMethods(['GET']))
router.route('/:lunchbreakId/comments').all(allowMethods(['GET', 'POST']))
router.route('/:lunchbreakId/comments').post(hasBodyValues(['comment'], 'all'))
router.route('/:lunchbreakId/participants').all(allowMethods(['GET', 'POST']))

router.param('lunchbreakId', asyncMiddleware(loader.loadLunchbreak))

router.route('/:lunchbreakId').get(asyncMiddleware(async (req, res, next) => {
	const { lunchbreak } = res.locals
	await user.can.readLunchbreak(lunchbreak)
	res.send(res.locals.lunchbreak)
}))

router.route('/:lunchbreakId/comments').get(asyncMiddleware(async (req, res, next) => {
	const { lunchbreak } = res.locals
	await user.can.readLunchbreak(lunchbreak)
	res.send(lunchbreak.comments)
}))

router.route('/:lunchbreakId/comments').post(asyncMiddleware(async (req, res, next) => {
	const comment = Comment.build({
		lunchbreakId: res.locals.lunchbreak.id,
		userId: user.id,
		comment: req.body.comment
	})

	await user.can.createComment(comment)

	res.send(await comment.save())
}))

router.route('/:lunchbreakId/participants').get((req, res, next) => {
	res.send(res.locals.lunchbreak.participants)
})

router.route('/:lunchbreakId/participants').post(asyncMiddleware(async (req, res, next) => {
	const participant = Participant.build({
		userId: user.id,
		lunchbreakId: parseInt(req.params.lunchbreakId)
	})

	await user.can.createParticipant(participant)

	res.send(await participant.save())
}))

module.exports = router
