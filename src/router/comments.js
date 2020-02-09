const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasBodyValues, convertParamToNumber } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['text'], 'all'))
router.route('/').post(
	asyncMiddleware(async (req, res, next) => {
		const { groupId, date } = req.params
		const { CommentController, LunchbreakController } = res.locals.controllers
		res.status(201).send(await CommentController.createComment(LunchbreakController, groupId, date, req.body))
	})
)

router.param('commentId', convertParamToNumber('commentId'))

router.route('/:commentId').all(allowMethods(['PUT', 'DELETE']))

router.route('/:commentId').put(hasBodyValues(['text'], 'all'))
router.route('/:commentId').put(
	asyncMiddleware(async (req, res, next) => {
		const { commentId } = req.params
		const { CommentController } = res.locals.controllers
		res.send(await CommentController.updateComment(commentId, req.body))
	})
)

router.route('/:commentId').delete(
	asyncMiddleware(async (req, res, next) => {
		const { commentId } = req.params
		const { CommentController } = res.locals.controllers
		await CommentController.deleteComment(commentId)
		res.status(204).send()
	})
)

module.exports = router
