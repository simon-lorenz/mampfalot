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

			if (!user) {
				res.status(400).send('Invalid token - user does not exists anymore.')
				return
			}

			res.locals.user = user.toJSON()
			next()
		} catch (error) {
			next(error)
		}
	},
	userIsGroupMember: function (req, res, next) {
		if (Util.getGroupIds(res.locals.user, false).includes(res.locals.group.id)) {
			next()
		} else {
			res.status(403).send()
		}
	},
	userIsGroupAdmin: function (req, res, next) {
		if (Util.getGroupIds(res.locals.user, true).includes(res.locals.group.id)) {
			next()
		} else {
			res.status(403).send()
		}
	}
}