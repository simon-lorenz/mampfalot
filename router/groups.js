const router = require('express').Router()
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const middleware = require('./../middleware/groups')
const commonMiddleware = require('./../middleware/common')

router.route('/').get(middleware.findAllGroups)

// 1. Lade die angefragte Gruppe
router.param('groupId', middleware.loadGroup)

// 2. Existiert die Gruppe (war 1. erfolgreich)?
router.param('groupId', middleware.groupExists)

// 3. Ist der User Mitglied der Gruppe?´
router.param('groupId', (req, res, next) => {
	commonMiddleware.userIsGroupMember(res.locals.group.id)(req, res, next)
})

router.route('/:groupId').get((req, res) => {
	res.send(res.locals.group)
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