const User = require('./../models').User
const Group = require('./../models').Group
const Util = require('./../util/util')

module.exports = {
	loadUser: async function (req, res, next) {
		let id = res.locals.token.id

		try {
			let user = await User.findOne({ 
				where: id, 
				include: [ 
					{
						model: Group,
						attributes: ['id'],
						through: {
							attributes: ['authorizationLevel'],
							as: 'config'
						}
					}
				 ]
			})
			res.locals.user = user.toJSON()
			next()
		} catch (error) {
			console.log(error)
			res.status(500).send(error)
		}
	},
	userIsGroupMember: function (groupId) {
		return function (req, res, next) {
			if (Util.getGroupIds(res.locals.user, false).includes(groupId)) {
				next()
			} else {
				res.status(403).send()
			}
		}
	},
	userIsGroupAdmin: function (groupId) {
		return function (req, res, next) {		
			if (Util.getGroupIds(res.locals.user, true).includes(groupId)) {
				next()
			} else {
				res.status(403).send()
			}
		}
	}
}