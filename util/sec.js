let Util = require('./util')

let sec = {}

sec.userIsGroupMember = function (req, res, next) {
	if (Util.getGroupIds(req.user, false).includes(parseInt(req.params.groupId))) {
		next()
	} else {
		res.status(403).send()
	}
}

sec.userIsGroupAdmin = function (req, res, next) {
	if (Util.getGroupIds(req.user, true).includes(parseInt(req.params.groupId))) {
		next()
	} else {
		res.status(403).send()
	}
}

module.exports = sec