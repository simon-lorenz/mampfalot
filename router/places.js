const express = require('express')
const router = express.Router()
const Place = require('./../models').Place
const Group = require('../models').Group
const FoodType = require('../models').FoodType
const util = require('./../util/util')
const commonMiddleware = require('../middleware/common')
const middleware = require('../middleware/places')

router.route('/').post((req, res, next) => {
	res.locals.group = { id: req.body.groupId }
	next()
})

router.route('/').post(commonMiddleware.userIsGroupAdmin, async (req, res, next) => {
	let group = await Group.findOne({
		where: {
			id: res.locals.group.id
		},
		include: [ FoodType ]
	})

	// Ist die angegebene foodTypeId der Gruppe zugeordnet?
	let typeBelongsToGroup = false
	for (let foodType of group.foodTypes) {
		if (foodType.id === parseInt(req.body.foodTypeId)) {
			typeBelongsToGroup = true
			break
		}
	}

	if(!typeBelongsToGroup) {
		res.status(400).send('Foreign key foodTypeId doesn\'t belong to group')
		return
	}

	Place.create({
		groupId: parseInt(req.body.groupId),
		foodTypeId: parseInt(req.body.foodTypeId),
		name: req.body.name
	})
	.then(result => {
		res.status(200).send(result)
	})
	.catch(error => {
		next(error)
	})
})

router.param('placeId', middleware.loadPlace)

router.route('/:placeId').get(commonMiddleware.userIsGroupMember, (req, res, next) => {
	res.send(res.locals.place)	
})

router.route('/:placeId').post(commonMiddleware.userIsGroupAdmin, (req, res, next) => {
	let data = {}

	if (req.body.foodTypeId) { data.foodTypeId = req.body.foodTypeId }
	if (req.body.name) { data.name = req.body.name }

	if (Object.keys(data).length === 0) {
		res.status(400).send('Please provide at least one parameter')
		return
	}

	let foodTypeIdBelongsToGroup = false
	for (let foodType of res.locals.group.foodTypes) {
		if (foodType.id === data.foodTypeId) {
			foodTypeIdBelongsToGroup = true
			break
		}
	}

	if (!foodTypeIdBelongsToGroup) {
		res.status(400).send('Invalid foodTypeId')
		return
	}

	res.locals.place.update(data)
	.then(instance => {
		res.send(instance)
	})
	.catch(err => {
		next(err)
	})
})

router.route('/:placeId').delete(commonMiddleware.userIsGroupAdmin, (req, res, next) => {
	res.locals.place.destroy()
	.then(() => {
		res.status(204).send()
	})
	.catch(err => {
		next(err)
	})
})

module.exports = router