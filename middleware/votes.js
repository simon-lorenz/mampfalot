const Vote = require('../models').Vote
const Participant = require('../models').Participant
const Place = require('../models').Place

module.exports = {
	async loadVote(req, res, next) {
		try {
			res.locals.vote = await Vote.findOne({
				where: {
					id: req.params.voteId
				},
				include: [ Participant, Place ]
			})

			if (!res.locals.vote) {
				res.status(404).send()
			}
			else if (res.locals.vote.participant.userId !== res.locals.user.id) {
				res.status(403).send()
			}
			else {
				next()
			}
		} catch (error) {
			next(error)
		}
	}
}