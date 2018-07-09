const Vote = require('../models').Vote
const Participant = require('../models').Participant

module.exports = {
	loadVote(req, res, next) {
		Vote.findOne({
			where: {
				id: req.params.voteId
			},
			include: [ Participant ]
		})
		.then(vote => {
			if (!vote) {
				res.status(404).send()
			} else if (vote.participant.userId !== res.locals.user.id) {
				res.status(403).send()
			} else {
				res.locals.vote = vote
				next()
			}
		})
		.catch(err => {
			next(err)
		})
	}
}