'use strict'

const router = require('express').Router()
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const loader = require('../classes/resource-loader')
const user = require('../classes/user')

router.route('/:commentId').all(allowMethods(['GET', 'POST', 'DELETE']))

router.param('commentId', asyncMiddleware(loader.loadComment))

router.route('/:commentId').get(asyncMiddleware(async (req, res, next) => {
	const { comment } = res.locals

	await user.can.readComment(comment)
	res.send(comment.toJSON())
}))

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
