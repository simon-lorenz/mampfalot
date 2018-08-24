const Participant = require('../models').Participant
const Vote = require('../models').Vote
const User = require('../models').User
const Lunchbreak = require('../models').Lunchbreak
const Place = require('../models').Place

module.exports = {
	loadParticipant: function(req, res, next) {
		Participant.findOne({
			attributes: {
				exclude: ['amountSpent']
			},
			where: {
				id: req.params.participantId
			},
			include: [
				{
					model: Vote,
					include: [Place]
				}, User, Lunchbreak ]
		})
		.then(participant => {
			if(!participant) {
				res.status(404).send()
			} else {
				res.locals.participant = participant
				next()
			}
		})
	},
	userIsParticipant: function(req, res, next) {
		if (res.locals.participant.userId !== res.locals.user.id) {
			res.status(403).send()
		} else {
			next()
		}
	}
}