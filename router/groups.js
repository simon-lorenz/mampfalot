const router = require('express').Router()
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const Group = require('./../models').Group
const middleware = require('./../middleware/groups')
const commonMiddleware = require('./../middleware/common')

router.route('/').get(middleware.findAllGroups)

router.route('/:groupId*').all([middleware.loadGroup, commonMiddleware.userIsGroupMember])

router.route('/:groupId').get((req, res) => {
	res.send(res.locals.group)
})

router.route('/:groupId').post(commonMiddleware.userIsGroupAdmin, async (req, res) => {
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
		.then(test => {
			res.send(test)
		})
		.catch(err => {
			res.status(500).send(err)
		})
})

router.route('/:groupId/members').get((req, res) => {
	res.send(res.locals.group.members)
})

router.route('/:groupId/lunchbreaks').get((req, res) => {
	res.send(res.locals.group.lunchbreaks)
})

router.route('/:groupId/foodTypes').get((req, res) => {
	res.send(res.locals.group.foodTypes)
})

router.route('/:groupId/foodTypes').post(commonMiddleware.userIsGroupAdmin, (req, res) => {
	FoodType.create({
			groupId: req.params.groupId,
			type: req.body.type
		})
		.then(result => {
			res.status(204).send()
		})
		.catch(err => {
			res.status(400).send()
		})
})

router.route('/:groupId/places').get((req, res) => {
	res.send(res.locals.group.places)
})

router.route('/:groupId/places').post(commonMiddleware.userIsGroupAdmin, (req, res) => {
	Place.create({
			groupId: req.params.groupId,
			foodTypeId: req.body.foodTypeId,
			name: req.body.name
		})
		.then(result => {
			res.status(204).send()
		})
		.catch(err => {
			res.status(400).send(err)
		})
})

module.exports = router