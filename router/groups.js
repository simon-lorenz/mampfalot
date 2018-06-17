const Group = require('./../models').Group
const router = require('express').Router()
const GroupMembers = require('./../models').GroupMembers
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const User = require('./../models').User
const Lunchbreak = require('./../models').Lunchbreak
const Util = require('./../util/util')
const sec = require('./../util/sec')

router.route('/').get((req, res) => {
	Group.findAll({
			where: {
				id: { in: Util.getGroupIds(req.user, false)
				}
			},
			include: [
				Place,
				FoodType,
				{
					model: User,
					as: 'members',
					through: {
						as: 'config',
						attributes: ['color', 'authorizationLevel']
					}
				}
			]
		})
		.then(groups => {
			res.send(groups)
		})
})

router.all('/:groupId*', [groupExists, sec.userIsGroupMember])

router.route('/:groupId').get((req, res) => {
	Group.findOne({
			where: {
				id: req.params.groupId
			},
			include: [
				Place,
				FoodType,
				{
					model: User,
					as: 'members',
					through: {
						as: 'config',
						attributes: ['color', 'authorizationLevel']
					}
				}
			]
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
	Group.findOne({
		where: {
			id: req.params.groupId
		},
		include: [
			{
				model: User,
				as: 'members',
				through: {
					as: 'config',
					attributes: ['color', 'authorizationLevel']
				}
			}
		]
	})
	.then(group => {
		res.send(group.members)
	})
})

router.route('/:groupId/foodTypes').get((req, res) => {
	Group.findOne({
		where: {
			id: req.params.groupId
		},
		include: [ FoodType ]
	})
	.then(group => {
		res.send(group.foodTypes)
	})
})

router.route('/:groupId/foodTypes').post(sec.userIsGroupAdmin, (req, res) => {
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
	Group.findOne({
		where: {
			id: req.params.groupId
		},
		include: [ Place ]
	})
	.then(group => {
		res.send(group.places)
	})
})

router.route('/:groupId/places').post(sec.userIsGroupAdmin, (req, res) => {
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

module.exports = router