'use strict'

const router = require('express').Router({ mergeParams: true })
const { allowMethods } = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')

router.route('/').all(allowMethods(['POST', 'DELETE']))

router.route('/').post(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	const { AbsenceController, LunchbreakController } = res.locals.controllers
	await AbsenceController.createAbsence(LunchbreakController, groupId, date)
	res.status(201).send()
}))

router.route('/').delete(asyncMiddleware(async (req, res, next) => {
	const { groupId, date } = req.params
	const { AbsenceController, LunchbreakController } = res.locals.controllers
	await AbsenceController.deleteAbsence(LunchbreakController, groupId, date)
	res.status(204).send()
}))

module.exports = router
