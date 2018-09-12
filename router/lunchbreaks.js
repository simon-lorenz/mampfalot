const router = require('express').Router()
const { Comment, Lunchbreak, Participant, Place, Vote, User } = require('../models')
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const { NotFoundError } = require('../classes/errors')

router.route('/:lunchbreakId').all(allowMethods(['GET', 'POST']))
router.route('/:lunchbreakId').post(hasBodyValues(['voteEndingTime', 'lunchTime'], 'atLeastOne'))
router.route('/:lunchbreakId/comments').all(allowMethods(['GET', 'POST']))
router.route('/:lunchbreakId/comments').post(hasBodyValues(['comment'], 'all'))
router.route('/:lunchbreakId/participants').all(allowMethods(['GET', 'POST']))

router.param('lunchbreakId', asyncMiddleware(async (req, res, next) => {
	let id = parseInt(req.params.lunchbreakId)

	res.locals.lunchbreak = await Lunchbreak.findOne({
		where: { id },
		include: [
			{
				model:Participant,
				attributes: {
					exclude: ['amountSpent']
				},
				include: [
					{
						model:Vote,
						include: [ Place ]
					},
					{
						model: User
					}]
			},
			{
				model: Comment
			}
		]
	})

	if (res.locals.lunchbreak) {
		next()
	} else {
		next(new NotFoundError('Lunchbreak', id))
	}
}))

router.route('/:lunchbreakId').get(asyncMiddleware(async (req, res, next) => {
	let { user, lunchbreak } = res.locals
	await user.can.readLunchbreak(lunchbreak)
	res.send(res.locals.lunchbreak)
}))

router.route('/:lunchbreakId').post(asyncMiddleware(async (req, res, next) => {
	let { user, lunchbreak } = res.locals

	if(req.body.voteEndingTime) { lunchbreak.voteEndingTime = req.body.voteEndingTime }
	if(req.body.lunchTime) { lunchbreak.lunchTime = req.body.lunchTime }

	await user.can.updateLunchbreak(lunchbreak)
	res.send(await lunchbreak.save())
}))

router.route('/:lunchbreakId/comments').get(asyncMiddleware(async (req, res, next) => {
	let { user, lunchbreak } = res.locals
	await user.can.readLunchbreak(lunchbreak)
	res.send(lunchbreak.comments)
}))

router.route('/:lunchbreakId/comments').post(asyncMiddleware(async (req, res, next) => {
	let { user } = res.locals

	let comment = Comment.build({
		lunchbreakId: res.locals.lunchbreak.id,
		userId: res.locals.user.id,
		comment: req.body.comment
	})

	await user.can.createComment(comment)

	res.send(await comment.save())
}))

router.route('/:lunchbreakId/participants').get((req, res, next) => {
	res.send(res.locals.lunchbreak.participants)
})

router.route('/:lunchbreakId/participants').post(asyncMiddleware(async (req, res, next) => {
	let { user } = res.locals

	let participant = Participant.build({
		userId: user.id,
		lunchbreakId: parseInt(req.params.lunchbreakId)
	})

	await user.can.createParticipant(participant)

	res.send(await participant.save())
}))

module.exports = router
