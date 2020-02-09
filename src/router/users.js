const router = require('express').Router()
const {
	allowMethods,
	hasQueryValues,
	hasBodyValues,
	convertParamToNumber,
	initializeUser,
	initializeControllers
} = require('../util/middleware')
const { asyncMiddleware } = require('../util/util')
const UserController = require('../controllers/user-controller')

router.route('/').all(allowMethods(['POST']))
router.route('/').post(hasBodyValues(['username', 'email', 'password'], 'all'))
router.route('/:username/verify').all(allowMethods(['GET', 'POST']))
router.route('/:username/verify').post(hasBodyValues(['token'], 'all'))
router.route('/:username/forgot-password').all(allowMethods(['GET', 'POST']))
router.route('/:username/forgot-password').post(hasBodyValues(['token', 'newPassword'], 'all'))
router.route('/:email/forgot-username').all(allowMethods(['GET']))

router.route('/').post(
	asyncMiddleware(async (req, res, next) => {
		await UserController.createUser(req.body)
		res.status(204).send()
	})
)

router.route('/:username/verify').get(
	asyncMiddleware(async (req, res, next) => {
		const { username } = req.params
		await UserController.initializeVerificationProcess(username)
		res.status(204).send()
	})
)

router.route('/:username/verify').post(
	asyncMiddleware(async (req, res, next) => {
		const { token } = req.body
		const { username } = req.params
		await UserController.finalizeVerificationProcess(username, token)
		res.status(204).send()
	})
)

router.route('/:username/forgot-password').get(
	asyncMiddleware(async (req, res, next) => {
		const { username } = req.params
		await UserController.initializePasswordResetProcess(username)
		res.status(204).send()
	})
)

router.route('/:username/forgot-password').post(
	asyncMiddleware(async (req, res, next) => {
		const { token, newPassword } = req.body
		const { username } = req.params
		await UserController.finalizePasswordResetProcess(username, token, newPassword)
		res.status(204).send()
	})
)

router.route('/:email/forgot-username').get(async (req, res, next) => {
	const { email } = req.params
	await UserController.initializeUsernameReminderProcess(email)
	res.status(204).send()
})

router.use([asyncMiddleware(initializeUser), initializeControllers])

router.route('/me').all(allowMethods(['GET', 'PUT', 'DELETE']))
router.route('/me').put(hasBodyValues(['username', 'firstName', 'lastName', 'email'], 'all'))
router.route('/me/groups').all(allowMethods(['GET']))
router.route('/me/invitations').all(allowMethods(['GET']))
router.route('/me/invitations/:groupId').all(allowMethods(['DELETE']))
router.route('/me/invitations/:groupId').delete(hasQueryValues(['accept'], 'all'))
router.route('/me/participations/:groupId').all(allowMethods(['GET']))
router.route('/me/participations/:groupId').get(hasQueryValues(['from', 'to'], 'all'))

router.route('/me').get(
	asyncMiddleware(async (req, res, next) => {
		const { user } = res.locals
		const { UserController } = res.locals.controllers
		res.send(await UserController.getUser(user.id))
	})
)

router.route('/me').put(
	asyncMiddleware(async (req, res, next) => {
		const { user } = res.locals
		const { UserController } = res.locals.controllers
		res.send(await UserController.updateUser(user.id, req.body))
	})
)

router.route('/me').delete(
	asyncMiddleware(async (req, res, next) => {
		const { user } = res.locals
		const { UserController } = res.locals.controllers
		await UserController.deleteUser(user.id)
		res.status(204).send()
	})
)

router.route('/me/groups').get(
	asyncMiddleware(async (req, res, next) => {
		const { user } = res.locals
		const { GroupController } = res.locals.controllers
		res.send(await GroupController.getGroupsByUser(user.id))
	})
)

router.route('/me/invitations').get(
	asyncMiddleware(async (req, res, next) => {
		const { InvitationController } = res.locals.controllers
		res.send(await InvitationController.getInvitationsOfCurrentUser())
	})
)

router.param('groupId', convertParamToNumber('groupId'))

router.route('/me/invitations/:groupId').delete(
	asyncMiddleware(async (req, res, next) => {
		const accept = req.query.accept === 'true'
		const { groupId } = req.params
		const { user } = res.locals
		const { InvitationController } = res.locals.controllers

		if (accept) {
			await InvitationController.acceptInvitation(user.id, groupId)
		} else {
			await InvitationController.rejectInvitation(user.id, groupId)
		}

		res.status(204).send()
	})
)

router.route('/me/participations/:groupId').get(
	asyncMiddleware(async (req, res, next) => {
		const { from, to } = req.query
		const { groupId } = req.params
		const { ParticipationController } = res.locals.controllers
		res.send(await ParticipationController.getParticipations(groupId, from, to))
	})
)

module.exports = router
