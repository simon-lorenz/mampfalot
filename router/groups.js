const router = require('express').Router()
const Place = require('./../models').Place
const Group = require('./../models').Group
const User = require('../models').User
const GroupMembers = require('./../models').GroupMembers
const Lunchbreak = require('./../models').Lunchbreak
const middleware = require('./../middleware/groups')
const commonMiddleware = require('./../middleware/common')
const foodTypeMiddleware = require('./../middleware/foodTypes')

router.route('/').get((req, res, next) => {
	Group.scope({ method: ['ofUser', res.locals.user]}).findAll()
	.then(groups => {
		res.send(groups)
	})
	.catch(err => {
		next(err)	
	})
})

router.route('/').post(async (req, res, next) => {
	try {
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
			authorizationLevel: 1
		})
		
		res.send(result)	
	} catch (err) {
		next(err)
	}
})

router.route('/:groupId*').all([middleware.loadGroup, commonMiddleware.userIsGroupMember])

router.route('/:groupId').get((req, res) => {
	res.send(res.locals.group)
})

router.route('/:groupId').post(commonMiddleware.userIsGroupAdmin, async (req, res, next) => {
	if (!(req.body.name || req.body.defaultLunchTime || req.body.defaultVoteEndingTime || req.body.pointsPerDay || req.body.maxPointsPerVote || req.body.minPointsPerVote )) {
		res.status(400).send()
		return
	}

	let group = await Group.findOne({
		where: {
			id: req.params.groupId
		}
	}) 

	if (req.body.name) { group.name = req.body.name }
	if (req.body.defaultLunchTime) { group.defaultLunchTime = req.body.defaultLunchTime }
	if (req.body.defaultVoteEndingTime) { group.defaultVoteEndingTime = req.body.defaultVoteEndingTime }
	if (req.body.pointsPerDay) { group.pointsPerDay = parseInt(req.body.pointsPerDay) }
	if (req.body.maxPointsPerVote) { group.maxPointsPerVote = parseInt(req.body.maxPointsPerVote) }
	if (req.body.minPointsPerVote) { group.minPointsPerVote = parseInt(req.body.minPointsPerVote) }

	group
		.save()
		.then(updated => {
			return res.send(updated)
		})
		.catch(err => {
			next(err)
		})
})

router.route('/:groupId/members').get((req, res) => {
	res.send(res.locals.group.members)
})

router.route('/:groupId/members').post(commonMiddleware.userIsGroupAdmin, (req, res, next) => {
	GroupMembers.create({
		userId: parseInt(req.body.userId),
		groupId: parseInt(res.locals.group.id),
		color: req.body.color,
		authorizationLevel: req.body.authorizationLevel
	})	
	.then(member => {
		return Group.findOne({
			where: {
				id: res.locals.group.id
			},
			attributes: [],
			include: [
				{
					model: User,
					as: 'members',
					through: {
						as: 'config',
						attributes: ['color', 'authorizationLevel']
					},
					where: {
						id: member.userId
					}
				}
			]
		})
		.then(group => {
			res.send(group.members[0])
		})
		.catch(err => {
			next(err)
		})
	})
	.catch(err => {
		next(err)
	})
})

router.route('/:groupId/members/:userId').post((req, res, next) => {
	let data = {}

	if (res.locals.user.id !== parseInt(req.params.userId)) {
		if(!res.locals.user.isGroupAdmin(parseInt(req.params.groupId))) {
			res.status(403).send()
			return
		}
	}

	if (req.body.color) { data.color = req.body.color }

	if (req.body.authorizationLevel) {
		if (parseInt(req.body.authorizationLevel) === 1 && !res.locals.user.isGroupAdmin(req.params.groupId)) {
			res.status(403)
			return
		} else {
			data.authorizationLevel = parseInt(req.body.authorizationLevel)
		}
	}

	GroupMembers.update(data, {
		where: {
			groupId: req.params.groupId,
			userId: req.params.userId
		}
	})
	.then(() => {
		GroupMembers.findOne({
			where: {
				groupId: req.params.groupId,
				userId: req.params.userId
			}
		})
		.then(member => {
			res.send(member)
		})
		.catch(err => {
			throw err
		})
	})
	.catch(err => {
		next(err)
	})
})

router.route('/:groupId/members/:userId').delete((req, res, next) => {
	if (res.locals.user.id !== parseInt(req.params.userId)) {
		if(!res.locals.user.isGroupAdmin(parseInt(req.params.groupId))) {
			res.status(403).send()
			return
		}
	}
	
	GroupMembers.destroy({
		where: {
			groupId: req.params.groupId,
			userId: req.params.userId
		}
	})
	.then(() => {
		res.status(204).send()
	})
	.catch(err => {
		next(err)
	})
})

router.route('/:groupId/lunchbreaks').get(middleware.loadLunchbreak)

router.route('/:groupId/lunchbreaks').post(async (req, res, next) => {
	let lb = await Lunchbreak.findOne({
		where: {
			groupId: req.params.groupId,
			date: req.body.date
		}
	})

	if (lb) {
		res.status(400).send('This group already has a lunchbreak planned at this date')
		return
	}

	if (req.body.lunchTime || req.body.voteEndingTime) {
		if(!res.locals.user.isGroupAdmin(res.locals.group.id)) {
			res.status(403).send()
			return
		}
	}

	Lunchbreak.create({
		groupId: parseInt(req.params.groupId),
		date: req.body.date,
		lunchTime: req.body.lunchTime || res.locals.group.defaultLunchTime,
		voteEndingTime: req.body.voteEndingTime || res.locals.group.defaultVoteEndingTime
	})
	.then(result => {
		res.send(result)
	})
	.catch(err => {
		next(err)
	})
})

router.route('/:groupId/foodTypes').get((req, res) => {
	res.send(res.locals.group.foodTypes)
})

router.route('/:groupId/foodTypes').post(commonMiddleware.userIsGroupAdmin, (req, res, next) => {
	req.body.groupId = req.params.groupId
	foodTypeMiddleware.postFoodType(req, res, next)
})

router.route('/:groupId/places').get((req, res) => {
	res.send(res.locals.group.places)
})

router.route('/:groupId/places').post(commonMiddleware.userIsGroupAdmin, (req, res, next) => {
	let foodTypeBelongsToGroup = false
	
	for (let foodType of res.locals.group.foodTypes) {
		if (foodType.id === parseInt(req.body.foodTypeId)) {
			foodTypeBelongsToGroup = true
			break
		}
	}

	if (!foodTypeBelongsToGroup) {
		res.status(400).send()
		return
	}

	Place.create({
			groupId: parseInt(req.params.groupId),
			foodTypeId: parseInt(req.body.foodTypeId),
			name: req.body.name
		})
		.then(result => {
			res.status(200).send(result)
		})
		.catch(err => {
			next(err)
	})
})

module.exports = router