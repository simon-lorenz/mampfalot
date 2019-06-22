'use strict'

const router = require('express').Router()
const { Place } = require('../models')
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const loader = require('../classes/resource-loader')
const user = require('../classes/user')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['foodType', 'name'], 'all'))
router.route('/:placeId').all(allowMethods(['PUT', 'DELETE']))
router.route('/:placeId').put(hasBodyValues(['foodType', 'name'], 'all'))

router.route('/').post((req, res, next) => {
	res.locals.place = Place.build({
		groupId: req.body.groupId,
		foodType: req.body.foodType,
		name: req.body.name
	})
	next()
})

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const { place } = res.locals

	await user.can.createPlace(place)
	await place.save()
	res.status(201).send({ id: place.id, name: place.name, foodType: place.foodType })
}))

router.param('placeId', asyncMiddleware(loader.loadPlace))

router.route('/:placeId').get(asyncMiddleware(async (req, res, next) => {
	const { place } = res.locals

	await user.can.readPlace(place)
	res.send(place)
}))

router.route('/:placeId').put(asyncMiddleware(async (req, res, next) => {
	const { place } = res.locals
	const { foodType, name } = req.body

	place.foodType = foodType
	place.name = name

	await user.can.updatePlace(place)
	await place.save()
	res.send({ id: place.id, name: place.name, foodType: place.foodType })
}))

router.route('/:placeId').delete(asyncMiddleware(async (req, res, next) => {
	const { place } = res.locals

	await user.can.deletePlace(place)
	await place.destroy()
	res.status(204).send()
}))

module.exports = router
