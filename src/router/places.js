const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['foodType', 'name'], 'all'))
router.route('/:placeId').all(allowMethods(['PUT', 'DELETE']))
router.route('/:placeId').put(hasBodyValues(['foodType', 'name'], 'all'))

router.route('/').post(
	asyncMiddleware(async (req, res, next) => {
		const { groupId } = req.params
		const { PlaceController } = res.locals.controllers
		res.status(201).send(await PlaceController.createPlace(groupId, req.body))
	})
)

router.route('/:placeId').put(
	asyncMiddleware(async (req, res, next) => {
		const { placeId } = req.params
		const { PlaceController } = res.locals.controllers
		res.send(await PlaceController.updatePlace(placeId, req.body))
	})
)

router.route('/:placeId').delete(
	asyncMiddleware(async (req, res, next) => {
		const { placeId } = req.params
		const { PlaceController } = res.locals.controllers
		await PlaceController.deletePlace(placeId)
		res.status(204).send()
	})
)

module.exports = router
