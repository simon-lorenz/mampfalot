let Util = require('./util')
let Lunchbreak = require('./../models').Lunchbreak

let sec = {}

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

		if (Util.getGroupIds(res.locals.user, false).includes(lunchbreak.groupId)) {
			next()
		} else {
			res.status(403).send()			
			return
		}
	})
}

module.exports = sec