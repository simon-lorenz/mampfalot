const Util = require('./../util/util')
const Lunchbreak = require('./../models').Lunchbreak
const Group = require('./../models').Group

module.exports = {
	checkVotes: function (req, res, next) {
		let votes = req.body.votes
		
		// Hat jeder Vote eine zulässige Punktezahl? (Zwischen minPointsPerVote und maxPointsPerVote)
		let minPointsPerVote = res.locals.groupConfiguration.minPointsPerVote
		let maxPointsPerVote = res.locals.groupConfiguration.maxPointsPerVote
	
		if (!Util.pointsInRange(votes, minPointsPerVote, maxPointsPerVote)) {
			res.status(400).send('Points are not in between ' + minPointsPerVote + ' and ' + maxPointsPerVote)
			return
		} 
	
		// Liegt die Gesamtpunktzahl zwischen den Werten 1 und pointsPerDay?
		let pointsPerDay = res.locals.groupConfiguration.pointsPerDay
		let pointSum = Util.getPointSum(votes)
		if (!(pointSum >= 1 && pointSum <= pointsPerDay)) {
			res.status(400).send('Sum of points has to be between 1 and ' + pointsPerDay)
			return
		}
	
		next()
	},
	loadGroupConfigurationByLunchbreakId: async function (req, res, next) {
		let group
		try {
			group = await Lunchbreak.findOne({
				where: {
					id: req.params.lunchbreakId
				},
				include: [ Group ]
			})
			.then(lunchbreak => {
				return lunchbreak.group.toJSON()
			})
	
			res.locals.groupConfiguration = group
			next()
		} catch (error) {
			console.log('loadGroupConfiguration() failed: ' + error)
			res.status(500).send()
		}
	}
}