const express = require('express')
const router = express.Router()
const Vote = require('./../models').Vote
const User = require('./../models').User
const Place = require('./../models').Place

router.route('/').get((req, res) => {
	let where = {}

	if (req.query.date) {
		where.date = req.query.date
	}

	if (req.query.userId) {
		where.userId = req.query.userId
	}

	Vote.findAll({
			attributes: {
				exclude: ['placeId', 'userId']
			},
			where,
			order: [
				['id', 'ASC']
			],
			include: [{
					model: User,
					attributes: {
						exclude: ['isAdmin']
					}
				},
				{
					model: Place
				}
			]
		})
		.then(result => {
			res.send(result)
		})
		.catch(error => {
			res.status(400).send('Ein Fehler ist aufgetreten' + error)
		})
})

router.route('/').post((req, res) => {
	let vote = {
		userId: parseInt(req.body.userId),
		placeId: parseInt(req.body.placeId),
		date: new Date(),
		points: parseInt(req.body.points)
	}

	if (vote.userId != res.locals.user.id) {
		res.status(403).send()
		return
	}

	Vote.create(vote)
		.then(result => {
			res.status(204).send()
		})
		.catch(error => {
			if (error.name === 'SequelizeValidationError') {
				res.status(400).send(error.errors)
			} else if (error.name === 'SequelizeForeignKeyConstraintError') {
				res.status(400).send('Foreign Key Error: ' + error.fields)
			} else {
				console.log(error)
				res.status(500).send(error)
			}
		})
})

router.route('/:voteId').get((req, res) => {
	Vote.findOne({
			where: {
				id: req.params.voteId
			}
		})
		.then(result => {
			if (result) {
				res.send(result)
			} else {
				res.status(404).send()
			}
		})
		.catch(error => {
			console.log(error)
			res.status(500).send('Something went wrong.')
		})
})

router.route('/:voteId').put((req, res) => {
	let updateData = {}

	if (req.body.placeId) {
		updateData.placeId = req.body.placeId
	}
	if (req.body.points) {
		updateData.points = req.body.points
	}
	if (req.body.date) {
		updateData.date = req.body.date
	}

	if (Object.keys(updateData).length === 0) {
		res.send(400).send('Request needs to have at least one of the following parameters: placeId, points or date')
		return
	}

	Vote.update(
			updateData, {
				where: {
					id: req.params.voteId,
					userId: res.locals.user.id
				}
			})
		.then(result => {
			res.send(result)
		})
		.catch(error => {
			console.log(error)
			res.status(500).send('Something went wrong.')
		})
})

router.route('/:voteId').delete((req, res) => {
	let voteId = req.params.voteId

	// Pflichtangaben überprüfen
	if (!voteId) {
		res.status(400).send({
			success: false,
			missingValues: 'voteId'
		})
		return
	}

	Vote.findOne({
			where: {
				id: voteId
			}
		})
		.then(result => {
			if (!result) {
				res.status(400).send({
					success: false,
					error: 'Invalid voteId'
				})
				return
			}

			// Admins dürfen alles löschen, User nur ihre eigenen Votes
			if (!res.locals.user.isAdmin && (result.userId !== res.locals.user.id)) {
				res.status(401).send({
					success: false,
					error: 'Unauthorized'
				})
				return
			}

			Vote.destroy({
					where: {
						id: voteId
					}
				})
				.then(() => {
					res.status(204).send()
				})
				.catch(err => {
					res.status(500).send({
						success: false
					})
				})
		})
		.catch(error => {
			res.status(500).send(error)
		})
})

module.exports = router