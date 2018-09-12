const router = require('express').Router()
const { Comment } = require('../models')
const { allowMethods } = require('../util/middleware')
const { NotFoundError } = require('../classes/errors')
const { asyncMiddleware } = require('../util/util')

router.route('/:commentId').all(allowMethods(['GET', 'POST', 'DELETE']))

router.route('/:commentId').all(asyncMiddleware(async (req, res, next) => {
	let id = parseInt(req.params.commentId)

	res.locals.comment = await Comment.findById(id)

	if (res.locals.comment) {
		return next()
	} else {
		return next(new NotFoundError('Comment', id))
	}
}))

router.route('/:commentId').get(asyncMiddleware(async (req, res, next) => {
	let { user, comment } = res.locals

	await user.can.readComment(comment)
	res.send(comment.toJSON())
}))

router.route('/:commentId').post(asyncMiddleware(async (req, res, next) => {
	let { user, comment } = res.locals

	comment.comment = req.body.comment
	await user.can.updateComment(comment)
	res.send(await comment.save())
}))

router.route('/:commentId').delete(asyncMiddleware(async (req, res, next) => {
	let { user, comment } = res.locals

	await user.can.deleteComment(comment)
	await comment.destroy()
	res.status(204).send()
}))

module.exports = router
