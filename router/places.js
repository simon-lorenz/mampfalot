const express = require('express')
const router = express.Router()
const Place = require('./../models').Place
const util = require('./../util/util')
const commonMiddleware = require('../middleware/common')
const middleware = require('../middleware/places')

router.route('/').post((req, res, next) => {
	res.locals.group = { id: req.body.groupId }
	next()
})

router.route('/').post(commonMiddleware.userIsGroupAdmin, (req, res, next) => {
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

router.use(commonMiddleware.userIsGroupAdmin)

router.route('/:placeId').put((req, res, next) => {
	let placeId = req.params.placeId

	let updateData = {}
	if (req.body.name) {
		updateData.name = req.body.name.trim()
	}
	if (req.body.foodTypeId) {
		updateData.foodTypeId = req.body.foodTypeId
	}

	if (Object.keys(updateData).length === 0) {
		res.status(400).send({
			error: 'Request needs to have at least one of the following parameters: name or foodTypeId'
		})
		return
	}

	Place.update(updateData, {
			where: {
				id: placeId,
				groupId: util.getGroupIds(res.locals.user, true)
			}
		})
		.then(result => {
			res.status(204).send()
		})
		.catch(err => {
			next(err)	
		})
})

router.route('/:placeId').delete((req, res, next) => {
	res.locals.place.destroy()
	.then(() => {
		res.status(204).send()
	})
	.catch(err => {
		next(err)
	})
})

module.exports = router