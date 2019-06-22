'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const loader = require('../classes/resource-loader')
const user = require('../classes/user')
const CommentController = require('../controllers/comment-controller')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['text'], 'all'))
router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	res.status(201).send(await CommentController.createComment(groupId, date, req.body))
}))

router.route('/:commentId').all(allowMethods(['PUT', 'DELETE']))

router.param('commentId', asyncMiddleware(loader.loadComment))

router.route('/:commentId').post(asyncMiddleware(async (req, res, next) => {
	const { comment } = res.locals

	comment.comment = req.body.comment
	await user.can.updateComment(comment)
	res.send(await comment.save())
}))

router.route('/:commentId').delete(asyncMiddleware(async (req, res, next) => {
	const { comment } = res.locals

	await user.can.deleteComment(comment)
	await comment.destroy()
	res.status(204).send()
}))

module.exports = router
