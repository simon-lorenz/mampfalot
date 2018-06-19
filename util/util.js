let Util = {}

Util.addKeyIfExists = function (from, to, key) {
	if (key in from) {
		to[key] = from[key]
	}
}

Util.missingValues = function (obj) {
	let undefinedKeys = []
	for (key in obj) {
		if (!obj[key]) {
			undefinedKeys.push(key)
		}
	}
	return undefinedKeys
}

Util.findDuplicates = function (arr) {
	let duplicates = []
	let sorted = arr.slice().sort()
	for (let i = 0; i < sorted.length; i++) {
		if (sorted[i] == sorted[i + 1]) {
			duplicates.push(sorted[i])
		}
	}
	return duplicates
}

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