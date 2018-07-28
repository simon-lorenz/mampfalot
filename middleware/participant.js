const Participant = require('../models').Participant
const Vote = require('../models').Vote
const User = require('../models').User

module.exports = {
	loadParticipant: function(req, res, next) {
		Participant.findOne({
			where: {
				id: req.params.participantId
			},
			include: [ Vote, User ]
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