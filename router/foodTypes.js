const express = require('express')
const router = express.Router()
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

router.route('/:foodTypeId').post((req, res, next) => {
	if (Object.keys(req.body).length === 0) {
		res.status(400).send({ error: 'No body values found '})
		return
	}

	res.locals.foodType.update({
		type: req.body.type
	})
	.then((instance) => {
		res.send(instance)
	})
	.catch(err => {
		next(err)
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
