let Util = {}

Util.isAdmin = function (req, res, next) {
	if (req.user.isAdmin) {
		next()
	} else {
		res.status(403).send({
			success: false,
			error: 'admin-privileges required'
		})
	}
}

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

module.exports = Util