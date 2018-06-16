let Util = require('./util')
let Lunchbreak = require('./../models').Lunchbreak

let sec = {}

sec.userIsGroupMember = function (user, groupId) {
	return Util.getGroupIds(user, false).includes(groupId)
}

sec.userIsGroupAdmin = function (user, groupId) {
	return Util.getGroupIds(user, true).includes(groupId)
}

sec.checkIfUserIsGroupMember = function (req, res, next) {
	if (this.userIsGroupMember(req.user, req.params.groupId)) {
		next()
	} else {
		res.status(403).send()
	}
}

sec.checkIfUserIsGroupAdmin = function (req, res, next) {
	if (this.userIsGroupAdmin(req.user, req.params.groupId)) {
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