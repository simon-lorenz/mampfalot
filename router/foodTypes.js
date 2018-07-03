const express = require('express')
const router = express.Router()
const FoodType = require('./../models').FoodType
const middleware = require('../middleware/foodTypes')
const commonMiddleware = require('../middleware/common')

router.route('/').post((req, res, next) => {
	res.locals.group = { id: req.body.groupId }
	next()
})

router.route('/').post([commonMiddleware.userIsGroupAdmin, middleware.postFoodType])

router.use('/:foodTypeId*', [middleware.loadFoodType, commonMiddleware.userIsGroupMember])

router.route('/:foodTypeId').get((req, res) => {
	res.send(res.locals.foodType)
})

router.use(commonMiddleware.userIsGroupAdmin)

router.route('/:foodTypeId').put((req, res) => {
	let foodTypeId = req.params.foodTypeId
	let updateData = {
		type: req.body.type
	}

	if (Object.keys(updateData).length === 0) {
		res.status(400).send()
		return
	}

	FoodType.update(updateData, {
			where: {
				id: foodTypeId
			}
		})
		.then(result => {
			res.status(204).send()
		})
		.catch(error => {
			console.log(error)
			res.status(500).send('Something went wrong.')
		})
})

router.route('/:foodTypeId').delete(async (req, res) => {
	try {
		await res.locals.foodType.destroy()
		res.status(204).send()
	} catch (error) {
		next(error)		
	}
})

module.exports = router