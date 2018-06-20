const Group = require('./../models').Group
const router = require('express').Router()
const GroupMembers = require('./../models').GroupMembers
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const User = require('./../models').User
const Lunchbreak = require('./../models').Lunchbreak
const Util = require('./../util/util')
const sec = require('./../util/sec')
const commonMiddleware = require('./../middleware/common')

router.route('/').get((req, res) => {
	Group.findAll({
			where: {
				id: { in: Util.getGroupIds(res.locals.user, false)
				}
			},
			include: [
				Place,
				FoodType,
				Lunchbreak,
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

router.param('groupId', (req, res, next) => {
	// 1. Lade die angefragte Gruppe
	Group.findOne({
		where: {
			id: req.params.groupId
		},
		include: [
			{
				model: Place,
				attributes: {
					exclude: ['foodTypeId', 'groupId']
				},
				include: [ FoodType ]
			},
			{
				model: FoodType,
				attributes: {
					exclude: ['groupId']
				}
			},
			{
				model: Lunchbreak,
				limit: parseInt(req.query.lunchbreakLimit) || 25
			},
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
		res.locals.group = group
		next()
	})
	.catch(err => {
		console.log(err)
		res.status(500).send()
	})
})

// 2. Existiert die Gruppe (war 1. erfolgreich)?
router.param('groupId', groupExists)

// 3. Ist der User Mitglied der Gruppe?´
router.param('groupId', (req, res, next) => {
	commonMiddleware.userIsGroupMember(res.locals.group.id)(req, res, next)
	// x(req, res, next)
})

router.route('/:groupId').get((req, res) => {
	res.send(res.locals.group)
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

router.route('/:groupId/foodTypes').get((req, res) => {
	FoodType.findAll({
		where: {
			groupId: req.params.groupId
		}
	})
	.then(foodTypes => {
		res.send(foodTypes)
	})
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
	Place.findAll({
		where: {
			groupId: req.params.groupId
		}
	})
	.then(places => {
		res.send(places)
	})
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