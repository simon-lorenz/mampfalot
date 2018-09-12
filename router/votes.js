const router = require('express').Router()
const { Vote, Participant, Place } = require('../models')
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const { ValidationError, NotFoundError, RequestError } = require('../classes/errors')

router.route('/').all(allowMethods(['POST']))
router.route('/:voteId').all(allowMethods(['GET', 'DELETE']))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	let votes = req.body

	if(Object.keys(votes).length === 0 || !(votes instanceof  Array)) {
		return next(new RequestError('Please provide an array of votes.'))
	}

	let participantId = votes[0].participantId
	for (let vote of votes) {
		if (vote.participantId !== participantId) {
			let item = {
				field: 'participantId',
				value: 'Various values',
				message: 'The participantId has to be the same in all votes.'
			}
			return next(new ValidationError([item]))
		}
	}

	if (!participantId) {
		let item = {
			field: 'participantId',
			value: null,
			message: 'participantId cannot be null.'
		}
		return next(new ValidationError([item]))
	}

	let { user } = res.locals

	let participant = await Participant.find({
		where: {
			id: participantId,
			userId: user.id
		}
	})

	if (!participant) {
		let item = {
			field: 'participantId',
			value: participantId,
			message: 'This participantId is not associated to your userId.'
		}
		return next(new ValidationError([item]))
	}

	await user.can.createVoteCollection(participant)
	await Vote.destroy({ where: { participantId } })
	await Vote.bulkCreate(votes, { validate: true })

	res.send(await Vote.findAll({
		where: { participantId },
		include: [ Participant, Place ]
	}))
}))

router.param('voteId', asyncMiddleware(async (req, res, next) => {
	let voteId = parseInt(req.params.voteId)
	res.locals.vote = await Vote.findOne({
		where: {
			id: voteId
		},
		include: [ Participant, Place ]
	})

	if (res.locals.vote) {
		next()
	} else {
		next(new NotFoundError('Vote', voteId))
	}
}))

router.route('/:voteId').get(asyncMiddleware(async (req, res, next) => {
	let { vote, user } = res.locals

	await user.can.readVote(vote)
	res.send(vote)
}))

router.route('/:voteId').delete(asyncMiddleware(async (req, res, next) => {
	let { vote, user } = res.locals

	await user.can.deleteVote(vote)
	await vote.destroy()
	res.status(204).send()
}))

module.exports = router
