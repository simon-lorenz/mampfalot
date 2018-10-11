const router = require('express').Router()
const { FoodType } = require('../models')
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const loader = require('../classes/resource-loader')

router.route('/').all(allowMethods(['POST']))
router.route('/:foodTypeId').all(allowMethods(['GET', 'POST', 'DELETE']))
router.route('/:foodTypeId').post(hasBodyValues(['type'], 'atLeastOne'))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	let foodType = FoodType.build({
		type: req.body.type,
		groupId: req.body.groupId
	})
	await res.locals.user.can.createFoodType(foodType)
	res.send(await foodType.save())
}))

router.param('foodTypeId', asyncMiddleware(loader.loadFoodType))

router.route('/:foodTypeId').get(asyncMiddleware(async (req, res, next) => {
	let { foodType, user } = res.locals

	await user.can.readFoodType(foodType)
	res.send(foodType)
}))

router.route('/:foodTypeId').post(asyncMiddleware(async (req, res, next) => {
	let { foodType, user } = res.locals

	foodType.type = req.body.type
	await user.can.updateFoodType(foodType)
	await foodType.save()
	res.send(foodType)
}))

router.route('/:foodTypeId').delete(asyncMiddleware(async (req, res, next) => {
	let { foodType, user } = res.locals

	await user.can.deleteFoodType(foodType)
	await foodType.destroy()
	res.status(204).send()
}))

module.exports = router
