'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasBodyValues, convertParamToNumber } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const user = require('../classes/user')
const CommentController = require('../controllers/comment-controller')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['text'], 'all'))
router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	res.status(201).send(await CommentController.createComment(groupId, date, req.body))
}))

router.param('commentId', convertParamToNumber('commentId'))

router.route('/:commentId').all(allowMethods(['PUT', 'DELETE']))

router.route('/:commentId').put(hasBodyValues(['text'], 'all'))
router.route('/:commentId').put(asyncMiddleware(async (req, res, next) => {
	const { commentId } = req.params
	res.send(await CommentController.updateComment(commentId, req.body))
}))

router.route('/:commentId').delete(asyncMiddleware(async (req, res, next) => {
	const { comment } = res.locals

	await user.can.deleteComment(comment)
	await comment.destroy()
	res.status(204).send()
}))

module.exports = router
