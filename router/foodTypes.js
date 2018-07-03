const express = require('express')
const router = express.Router()
const FoodType = require('./../models').FoodType
const middleware = require('../middleware/foodTypes')
const commonMiddleware = require('../middleware/common')


router.route('/').get((req, res) => {
	FoodType.findAll({
			order: [
				['id', 'ASC']
			]
		})
		.then(result => {
			res.send(result)
		})
		.catch(error => {
			res.status(400).send('Ein Fehler ist aufgetreten' + error)
		})
})

router.route('/').post(middleware.postFoodType)

router.use('/:foodTypeId*', middleware.loadFoodType)

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

router.route('/:foodTypeId').delete((req, res) => {
	FoodType.destroy({
			where: {
				id: req.params.foodTypeId
			}
		})
		.then(result => {
			if (result === 0) {
				res.status(404).send()
			} else {
				res.status(204).send()
			}
		})
		.catch(error => {
			console.log(error)
			res.status(500).send('Something went wrong.')
		})
})

module.exports = router