let Util = require('./util')
let Lunchbreak = require('./../models').Lunchbreak

let sec = {}

sec.userIsGroupMember = function (req, res, next) {
	let user = req.user
	let groupId = parseInt(req.params.groupId)

	if (Util.getGroupIds(user, false).includes(groupId)) {
		next()
	} else {
		res.status(403).send()
	}
}

sec.userIsGroupAdmin = function (req, res, next) {
	let user = req.user
	let groupId = parseInt(req.params.groupId)

	if (Util.getGroupIds(user, true).includes(groupId)) {
		next()
	} else {
		res.status(403).send()
	}
}

sec.userHasAccessToLunchbreak = function (req, res, next) {
	Lunchbreak.findOne({
		attributes: ['groupId'],
		where: {
			id: req.params.lunchbreakId
		},
		raw: true
	})
	.then(lunchbreak => {
		if (!lunchbreak) {
			res.status(404).send()
			return
		}

		if (!sec.userIsGroupMember(req.user, lunchbreak.groupId)) {
			res.status(403).send()			
			return
		}

		next()
	})
}

module.exports = sec