const Util = require('./../util/util')
const Lunchbreak = require('./../models').Lunchbreak
const Group = require('./../models').Group
const Comment = require('../models').Comment
const Vote = require('../models').Vote
const Participant = require('../models').Participant
const Place = require('./../models').Place

module.exports = {
	loadLunchbreak: function(req, res, next) {
		Lunchbreak.findOne({
			where: {
				id: req.params.lunchbreakId
			},
			include: [ Participant, Comment ]
		})
		.then(lunchbreak => {
			if(!lunchbreak) {
				res.status(404).send()
			} else {
				if(!res.locals.user.isGroupMember(lunchbreak.groupId)) {
					res.status(403).send()
					return
				}
				res.locals.lunchbreak = lunchbreak
				next()
			}
		})
	},
	loadParticipant: function(req, res, next) {
		Participant.findOne({
			where: {
				id: req.params.participantId
			},
			include: [ Vote ]
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
	checkVotes: function (req, res, next) {
		let votes = req.body.votes
		
		// Hat jeder Vote eine zulässige Punktezahl? (Zwischen minPointsPerVote und maxPointsPerVote)
		let minPointsPerVote = res.locals.groupInfo.minPointsPerVote
		let maxPointsPerVote = res.locals.groupInfo.maxPointsPerVote
	
		if (!Util.pointsInRange(votes, minPointsPerVote, maxPointsPerVote)) {
			res.status(400).send('Points are not in between ' + minPointsPerVote + ' and ' + maxPointsPerVote)
			return
		} 
	
		// Liegt die Gesamtpunktzahl zwischen den Werten 1 und pointsPerDay?
		let pointsPerDay = res.locals.groupInfo.pointsPerDay
		let pointSum = Util.getPointSum(votes)
		if (!(pointSum >= 1 && pointSum <= pointsPerDay)) {
			res.status(400).send('Sum of points has to be between 1 and ' + pointsPerDay)
			return
		}

		// Hat jeder Vote eine zulässige PlaceId?
		let placeIds = []
		res.locals.groupInfo.places.forEach(place => {
			placeIds.push(place.id)
		})
		
		for (let vote of votes) {
			if (!placeIds.includes(vote.placeId)) {
				res.status(400).send('Incorrect placeId!')
				return
			}
		}
	
		next()
	},
	loadGroupInfoByLunchbreakId: async function (req, res, next) {
		let group
		try {
			group = await Lunchbreak.findOne({
				where: {
					id: req.params.lunchbreakId
				},
				include: [ 
					{
						model: Group,
						include: [ Place ]
					}
				]
			})
			.then(lunchbreak => {
				return lunchbreak.group.toJSON()
			})
	
			res.locals.groupInfo = group
			next()
		} catch (error) {
			console.log('loadGroupConfiguration() failed: ' + error)
			res.status(500).send()
		}
	}
}