'use strict'

const router = require('express').Router()
const { Vote, Participant, Place } = require('../models')
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const { ValidationError, RequestError } = require('../classes/errors')
const loader = require('../classes/resource-loader')
const user = require('../classes/user')

router.route('/').all(allowMethods(['POST']))
router.route('/:voteId').all(allowMethods(['GET', 'DELETE']))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const votes = req.body

	if(Object.keys(votes).length === 0 || !(votes instanceof  Array)) {
		return next(new RequestError('Please provide an array of votes.'))
	}

	const participantId = votes[0].participantId
	for (const vote of votes) {
		if (vote.participantId !== participantId) {
			const item = {
				field: 'participantId',
				value: 'Various values',
				message: 'The participantId has to be the same in all votes.'
			}
			return next(new ValidationError([item]))
		}
	}

	if (!participantId) {
		const item = {
			field: 'participantId',
			value: null,
			message: 'participantId cannot be null.'
		}
		return next(new ValidationError([item]))
	}

	const participant = await Participant.findOne({
		where: {
			id: participantId,
			userId: user.id
		}
	})

	if (!participant) {
		const item = {
			field: 'participantId',
			value: participantId,
			message: 'This participantId is not associated to your userId.'
		}
		return next(new ValidationError([item]))
	}

	await user.can.createVoteCollection(participant)

	const oldVotes = await Vote.findAll({ where: { participantId } })

	await Vote.bulkCreate(votes, { validate: true })

	for(const vote of oldVotes) {
		await vote.destroy()
	}

	res.send(await Vote.findAll({
		where: { participantId },
		include: [ Participant, Place ]
	}))
}))

router.param('voteId', asyncMiddleware(loader.loadVote))

router.route('/:voteId').get(asyncMiddleware(async (req, res, next) => {
	const { vote } = res.locals

	await user.can.readVote(vote)
	res.send(vote)
}))

router.route('/:voteId').delete(asyncMiddleware(async (req, res, next) => {
	const { vote } = res.locals

	await user.can.deleteVote(vote)
	await vote.destroy()
	res.status(204).send()
}))

module.exports = router
