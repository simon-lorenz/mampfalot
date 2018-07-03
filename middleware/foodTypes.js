const FoodType = require('../models').FoodType
const Sequelize = require('sequelize')

module.exports = {
	async loadFoodType(req, res, next) {
		let id = parseInt(req.params.foodTypeId)
		try {
			res.locals.foodType = await FoodType.findOne({
				where: {
					id
				}
			})

			if (!res.locals.foodType) {
				res.status(404).send()
				return
			}

			res.locals.group = { id: res.locals.foodType.groupId }

			next()

		} catch (error) {
			console.log(error)
			res.status(500).send()
		}
	},
	postFoodType(req, res, next) {
		FoodType.create({
			type: req.body.type,
			groupId: req.body.groupId
		})
		.then(result => {
			res.status(200).send(result)
		})
		.catch(err => {
			next(err)
		})
	}
}