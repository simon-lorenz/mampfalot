const Group = require('./../models').Group
const router = require('express').Router()
const GroupMembers = require('./../models').GroupMembers
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const User = require('./../models').User
const Lunchbreak = require('./../models').Lunchbreak
const Util = require('./../util/util')

router.route('/').get((req, res) => {
	Group.findAll({
			where: {
				id: { in: Util.getGroupIds(req.user, false)
				}
			}
		})
		.then(groups => {
			res.send(groups)
		})
})

router.all('/:groupId*', [groupExists, userIsGroupMember])

router.route('/:groupId').get((req, res) => {
	Group.findOne({
			where: {
				id: req.params.groupId
			}
		})
		.then(group => {
			res.send(group)
		})
})

router.route('/:groupId/lunchbreaks').get((req, res) => {
	Lunchbreak.findAll({
			where: {
				groupId: req.params.groupId
			}
		})
		.then(lunchbreaks => {
			res.send(lunchbreaks)
		})
		.catch(err => {
			res.send(err)
		})
})

router.route('/:groupId/members').get((req, res) => {
	GroupMembers.findAll({
			where: {
				groupId: req.params.groupId
			},
			include: [User]
		})
		.then(result => {
			res.send(result)
		})
})

router.route('/:groupId/foodTypes').get((req, res) => {
	FoodType.findAll({
			where: {
				groupId: req.params.groupId
			}
		})
		.then(result => {
			res.send(result)
		})
})

router.route('/:groupId/foodTypes').post(userIsGroupAdmin, (req, res) => {
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
	Place.findAll({
			where: {
				groupId: req.params.groupId
			}
		})
		.then(result => {
			res.send(result)
		})
})

router.route('/:groupId/places').post(userIsGroupAdmin, (req, res) => {
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

async function groupExists(req, res, next) {
	await Group.findOne({
			where: {
				id: req.params.groupId
			},
			raw: true
		})
		.then(group => {
			if (group) {
				next()
			} else {
				res.status(404).send()
			}
		})
}

function userIsGroupMember(req, res, next) {
	if (Util.getGroupIds(req.user, false).includes(parseInt(req.params.groupId))) {
		next()
	} else {
		res.status(403).send()
	}
}

function userIsGroupAdmin(req, res, next) {
	if (Util.getGroupIds(req.user, true).includes(parseInt(req.params.groupId))) {
		next()
	} else {
		res.status(403).send()
	}
}


module.exports = router