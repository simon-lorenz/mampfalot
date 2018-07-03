const router = require('express').Router()
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const Group = require('./../models').Group
const GroupMembers = require('./../models').GroupMembers
const Lunchbreak = require('./../models').Lunchbreak
const middleware = require('./../middleware/groups')
const commonMiddleware = require('./../middleware/common')
const foodTypeMiddleware = require('./../middleware/foodTypes')
const Sequelize = require('sequelize')

router.route('/').get(middleware.findAllGroups)

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
	if (req.body.pointsPerDay) { group.pointsPerDay = req.body.pointsPerDay }
	if (req.body.maxPointsPerVote) { group.maxPointsPerVote = req.body.maxPointsPerVote }
	if (req.body.minPointsPerVote) { group.minPointsPerVote = req.body.minPointsPerVote }

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

router.route('/:groupId/lunchbreaks').get((req, res) => {
	res.send(res.locals.group.lunchbreaks)
})

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