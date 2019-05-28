'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasQueryValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const LunchbreakController = require('../controllers/lunchbreak-controller')
const ParticipationRouter = require('./participation')

router.route('/').all(allowMethods(['GET', 'POST']))
router.route('/').get(hasQueryValues(['from', 'to'], 'all'))

router.route('/').get(asyncMiddleware(async (req, res, next) => {
	const { from, to } = req.query
	const { groupId } = req.params
	res.send(await LunchbreakController.getLunchbreaks(groupId, from, to))
}))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	res.status(201).send(await LunchbreakController.createLunchbreak(groupId, date))
}))

router.route('/:date').get(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	res.send(await LunchbreakController.getLunchbreak(groupId, date))
}))

router.use('/:date/participation', ParticipationRouter)



// router.route('/:lunchbreakId').all(allowMethods(['GET']))
// router.route('/:lunchbreakId/comments').all(allowMethods(['GET', 'POST']))
// router.route('/:lunchbreakId/comments').post(hasBodyValues(['comment'], 'all'))
// router.route('/:lunchbreakId/participants').all(allowMethods(['GET', 'POST']))

// router.param('lunchbreakId', asyncMiddleware(loader.loadLunchbreak))

// router.route('/:lunchbreakId').get(asyncMiddleware(async (req, res, next) => {
// 	const { lunchbreak } = res.locals
// 	await user.can.readLunchbreak(lunchbreak)
// 	res.send(res.locals.lunchbreak)
// }))

// router.route('/:lunchbreakId/comments').get(asyncMiddleware(async (req, res, next) => {
// 	const { lunchbreak } = res.locals
// 	await user.can.readLunchbreak(lunchbreak)
// 	res.send(lunchbreak.comments)
// }))

// router.route('/:lunchbreakId/comments').post(asyncMiddleware(async (req, res, next) => {
// 	const comment = Comment.build({
// 		lunchbreakId: res.locals.lunchbreak.id,
// 		userId: user.id,
// 		comment: req.body.comment
// 	})

// 	await user.can.createComment(comment)

// 	res.send(await comment.save())
// }))

// router.route('/:lunchbreakId/participants').get((req, res, next) => {
// 	res.send(res.locals.lunchbreak.participants)
// })

// router.route('/:lunchbreakId/participants').post(asyncMiddleware(async (req, res, next) => {
// 	const participant = Participant.build({
// 		userId: user.id,
// 		lunchbreakId: parseInt(req.params.lunchbreakId)
// 	})

// 	await user.can.createParticipant(participant)

// 	res.send(await participant.save())
// }))

module.exports = router
