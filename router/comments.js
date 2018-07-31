const express = require('express')
const router = express.Router()
const middleware = require('../middleware/comment')

router.param('commentId', middleware.loadComment)

router.route('/:commentId').post(middleware.userOwnsComment, (req, res, next) => {
	if (!req.body.comment) {
		res.status(400).send()
		return
	}

	res.locals.comment.comment = req.body.comment
	res.locals.comment.save()
	.then(instance => {
		res.send(instance)
	})
	.catch(err => {
		next(err)
	})
})

router.route('/:commentId').delete(middleware.userOwnsComment, (req, res, next) => {
	res.locals.comment.destroy()
	.then(() => {
		res.status(204).send()
	})
	.catch(err => {
		next(err)
	})
})

module.exports = router