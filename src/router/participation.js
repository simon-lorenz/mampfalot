const router = require('express').Router({ mergeParams: true })
const { allowMethods, hasBodyValues } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')

router.route('/').all(allowMethods(['POST', 'PUT', 'DELETE']))
router.post('/', hasBodyValues(['amountSpent', 'result', 'votes'], 'all'))
router.put('/', hasBodyValues(['amountSpent', 'result', 'votes'], 'atLeastOne'))

router.route('/').post(
	asyncMiddleware(async (req, res, next) => {
		const { groupId, date } = req.params
		const participation = req.body
		const { ParticipationController, LunchbreakController } = res.locals.controllers
		res
			.status(201)
			.send(await ParticipationController.createParticipation(groupId, date, participation, LunchbreakController))
	})
)

router.route('/').put(
	asyncMiddleware(async (req, res, next) => {
		const { groupId, date } = req.params
		const values = req.body
		const { ParticipationController } = res.locals.controllers
		res.send(await ParticipationController.updateParticipation(groupId, date, values))
	})
)

router.route('/').delete(
	asyncMiddleware(async (req, res, next) => {
		const { groupId, date } = req.params
		const { ParticipationController } = res.locals.controllers
		res.status(204).send(await ParticipationController.deleteParticipation(groupId, date))
	})
)

module.exports = router
