const router = require('express').Router()
const { Place, Group, User, GroupMembers, Lunchbreak, FoodType, Invitation } = require('../models')
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const loader = require('../classes/resource-loader')

router.route('/').all(allowMethods(['GET', 'POST']))
router.route('/:groupId').all(allowMethods(['GET', 'POST', 'DELETE']))
router.route('/:groupId').post(hasBodyValues(['name', 'defaultLunchTime', 'defaultVoteEndingTime', 'pointsPerDay', 'maxPointsPerVote', 'minPointsPerVote'], 'atLeastOne'))
router.route('/:groupId/invitations').all(allowMethods(['GET', 'POST', 'DELETE']))
router.route('/:groupId/members').all(allowMethods(['GET', 'POST']))
router.route('/:groupId/members/:userId').all(allowMethods(['POST', 'DELETE']))
router.route('/:groupId/lunchbreaks').all(allowMethods(['GET', 'POST']))
router.route('/:groupId/lunchbreaks').post(hasBodyValues(['date', 'all']))
router.route('/:groupId/foodTypes').all(allowMethods(['GET', 'POST']))
router.route('/:groupId/places').all(allowMethods(['GET', 'POST']))
router.route('/:groupId/places').post(hasBodyValues(['foodTypeId', 'name'], 'all'))

router.route('/').get((req, res, next) => {
	Group.scope({
			method: ['ofUser', res.locals.user]
		}).findAll()
		.then(groups => {
			res.send(groups)
		})
		.catch(err => {
			next(err)
		})
})

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	let result = await Group.create({
		name: req.body.name,
		defaultLunchTime: req.body.defaultLunchTime,
		defaultVoteEndingTime: req.body.defaultVoteEndingTime,
		pointsPerDay: parseInt(req.body.pointsPerDay),
		maxPointsPerVote: parseInt(req.body.maxPointsPerVote),
		minPointsPerVote: parseInt(req.body.minPointsPerVote)
	})

	await GroupMembers.create({
		groupId: result.id,
		userId: res.locals.user.id,
		isAdmin: true
	})

	let group = await Group.findOne({
		where: {
			id: result.id
		},
		include: [{
				model: Place,
				attributes: {
					exclude: ['groupId']
				},
				order: ['id']
			},
			{
				model: FoodType,
				attributes: {
					exclude: ['groupId']
				},
				order: ['id']
			},
			{
				model: Lunchbreak,
				limit: parseInt(req.query.lunchbreakLimit) || 25,
				order: ['id']
			},
			{
				model: User,
				as: 'members',
				through: {
					as: 'config',
					attributes: ['color', 'isAdmin']
				}
			}
		]
	})
	res.send(group)
}))

router.param('groupId', asyncMiddleware(loader.loadGroup))

router.route('/:groupId').get(asyncMiddleware(async (req, res, next) => {
	let { user, group } = res.locals
	await user.can.readGroup(group)
	res.send(group)
}))

router.route('/:groupId').post((req, res, next) => {
	let { group } = res.locals

	if (req.body.name) {
		group.name = req.body.name
	}
	if (req.body.defaultLunchTime) {
		group.defaultLunchTime = req.body.defaultLunchTime
	}
	if (req.body.defaultVoteEndingTime) {
		group.defaultVoteEndingTime = req.body.defaultVoteEndingTime
	}
	if (req.body.pointsPerDay) {
		group.pointsPerDay = parseInt(req.body.pointsPerDay)
	}
	if (req.body.maxPointsPerVote) {
		group.maxPointsPerVote = parseInt(req.body.maxPointsPerVote)
	}
	if (req.body.minPointsPerVote) {
		group.minPointsPerVote = parseInt(req.body.minPointsPerVote)
	}

	next()
})
router.route('/:groupId').post(asyncMiddleware(async (req, res, next) => {
	let { group, user } = res.locals

	await user.can.updateGroup(group)
	res.send(await group.save())
}))

router.route('/:groupId').delete(asyncMiddleware(async (req, res, next) => {
	let { group, user } = res.locals
	await user.can.deleteGroup(group)
	await group.destroy()
	res.status(204).send()
}))

router.route('/:groupId/invitations').get(asyncMiddleware(async (req, res, next) => {
	const { user, group } = res.locals
	await user.can.readInvitationCollection(group)
	res.send(group.invitations)
}))

router.route('/:groupId/members').get(asyncMiddleware(async (req, res, next) => {
	let { user, group } = res.locals
	await user.can.readGroupMemberCollection(group)
	res.send(group.members)
}))

router.route('/:groupId/members').post(asyncMiddleware(async (req, res, next) => {
	let { user } = res.locals

	let member = GroupMembers.build({
		userId: req.body.userId,
		groupId: res.locals.group.id,
		color: req.body.color,
		isAdmin: req.body.isAdmin
	})

	await user.can.createGroupMember(member)
	await member.save()

	let groupNew = await Group.findOne({
		where: {
			id: res.locals.group.id
		},
		attributes: [],
		include: [{
			model: User,
			attributes: ['id', 'username', 'firstName', 'lastName'],
			as: 'members',
			through: {
				as: 'config',
				attributes: ['color', 'isAdmin']
			},
			where: {
				id: member.userId
			}
		}]
	})

	res.send(groupNew.members[0])
}))

router.route('/:groupId/members/:userId').all(asyncMiddleware(loader.loadMember))

router.route('/:groupId/members/:userId').post(asyncMiddleware(async (req, res, next) => {
	let { user, member } = res.locals

	await user.can.updateGroupMember(member, req.body.isAdmin)

	if (req.body.isAdmin !== undefined) {
		member.isAdmin = req.body.isAdmin
	}
	member.color = req.body.color

	await user.can.updateGroupMember(member)
	res.send(await member.save())
}))

router.route('/:groupId/members/:userId').delete(asyncMiddleware(async (req, res, next) => {
	let { user, member } = res.locals

	await user.can.deleteGroupMember(member)
	await res.locals.member.destroy()
	res.status(204).send()
}))

router.route('/:groupId/lunchbreaks').get(asyncMiddleware(async (req, res, next) => {
	let { user, group } = res.locals

	await user.can.readGroup(group)

	let finder = {}
	finder.where = {}
	if (req.params.groupId) finder.where.groupId = req.params.groupId
	if (req.query.date) finder.where.date = req.query.date

	res.send(await Lunchbreak.findAll(finder))
}))

router.route('/:groupId/lunchbreaks').post(asyncMiddleware(async (req, res, next) => {
	let { user, group } = res.locals

	let lunchbreak = Lunchbreak.build({
		groupId: req.params.groupId,
		date: req.body.date,
		lunchTime: req.body.lunchTime,
		voteEndingTime: req.body.voteEndingTime
	})

	await user.can.createLunchbreak(lunchbreak)

	res.send(await Lunchbreak.create({
		groupId: parseInt(req.params.groupId),
		date: req.body.date,
		lunchTime: req.body.lunchTime || group.defaultLunchTime,
		voteEndingTime: req.body.voteEndingTime || group.defaultVoteEndingTime
	}))
}))

router.route('/:groupId/foodTypes').get((req, res) => {
	res.send(res.locals.group.foodTypes)
})

router.route('/:groupId/places').get((req, res) => {
	res.send(res.locals.group.places)
})

router.route('/:groupId/places').post(asyncMiddleware(async (req, res, next) => {
	let { user } = res.locals

	let place = Place.build({
		groupId: parseInt(req.params.groupId),
		foodTypeId: parseInt(req.body.foodTypeId),
		name: req.body.name
	})

	await user.can.createPlace(place)
	res.send(await place.save())
}))

module.exports = router
