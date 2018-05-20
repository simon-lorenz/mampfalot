const Group = require('./../models/group')
const router = require('express').Router()
const GroupMembers = require('./../models/groupMembers')
const FoodType = require('./../models/foodType')
const Place = require('./../models/place')
const User = require('./../models/user')

router.route('/').get((req, res) => {
	Group.findAll()
		.then(result => {
			res.send(result)
		})
})

router.route('/:groupId').get((req, res) => {
	Group.findOne({
			where: {
				id: req.params.groupId
			}
		})
		.then(group => {
			if (group) {
				res.send(group)
			} else {
				res.status(404).send()
			}
		})
})

router.route('/:groupId/members').get((req, res) => {
	GroupMembers.findAll({
			attributes: {
				exclude: ['userId', 'groupId']
			},
			where: {
				groupId: req.params.groupId
			},
			include: [{
				model: User,
				attributes: {
					exclude: ['id', 'password', 'createdAt', 'updatedAt']
				}
			}]
		})
		.then(result => {
			if (result.length > 0) {
				res.send(result)
			} else {
				res.status(404).send()
			}
		})
})

router.route('/:groupId/foodTypes').get((req, res) => {
	FoodType.findAll({
		attributes: {
			exclude: ['groupId']
		},
		where: {
			groupId: req.params.groupId
		}
	})
	.then(result => {
		if (result.length > 0) {
			res.send(result)
		} else {
			res.status(404).send()
		}
	})
})

router.route('/:groupId/foodTypes').post((req, res) => {
	Group.findOne({
		where: {
			id: req.params.groupId
		}
	})
	.then(group => {
		if (!group) {
			res.status(404).send()
			return
		}

		FoodType.create({
			groupId: req.params.groupId,
			type: req.body.type
		})
		.then(result => {
			res.status(204).send()
		})
		.catch(err => {
			res.status(400).send()
		})
	})
})

router.route('/:groupId/places').get((req, res) => {
	Place.findAll({
		where: {
			groupId: req.params.groupId
		}
	})
	.then(result => {
		if (result.length > 0) {
			res.send(result)
		} else {
			res.status(404).send()
		}
	})
})

router.route('/:groupId/places').post((req, res) => {
	Place.create({
		groupId: req.params.groupId,
		foodTypeId: req.body.foodTypeId,
		name: req.body.name
	})
	.then(result => {
		res.status(204).send()
	})
	.catch(err => {
		res.status(400).send(err)
	})
})

module.exports = router