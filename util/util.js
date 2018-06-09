const GroupMembers = require('./../models/groupMembers')
const User = require('./../models/user')

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

Util.loadUserGroups = function (req, res, next) {		
	req.user.groups = []

	GroupMembers.findAll({
		attributes: {
			exclude: ['userId']
		},
		where: {
			userId: req.user.id
		},
		raw: true
	})
	.then(result => {
		for (group of result) {
			req.user.groups.push(group)
		}
		next()
	})
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

Util.getGroupIds = function (user, adminOnly = false) {
	let groupIds = []
	for (group of user.groups) {
		if (adminOnly) {
			if (group.authorizationLevel === 1) {
				groupIds.push(group.groupId)
			}
		} else {
			groupIds.push(group.groupId)
		}
	}
	return groupIds
}

module.exports = Util