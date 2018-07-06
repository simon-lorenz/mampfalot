let Util = {}

Util.getGroupIds = function (user, adminOnly = false) {
	let groupIds = []
	for (group of user.groups) {
		if (adminOnly) {
			if (group.config.authorizationLevel === 1) {
				groupIds.push(group.id)
			}
		} else {
			groupIds.push(group.id)
		}
	}
	return groupIds
}

Util.pointsInRange = function(votes, min, max) {
	for (vote of votes) {
		if (!(vote.points >= min && vote.points <= max)) {
			return false
		}
	}

	return true
}

Util.getPointSum = function (votes) {
	let sum = 0
	for (vote of votes) {
		sum += vote.points
	}
	return sum
}

module.exports = Util