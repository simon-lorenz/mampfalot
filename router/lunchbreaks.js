const express = require('express')
const router = express.Router()
const Lunchbreak = require('./../models').Lunchbreak
const Comment = require('./../models').Comment
const Util = require('./../util/util')

// Liefert alle Lunchbreaks der Gruppen des Users
router.route('/').get((req, res) => {
	Lunchbreak.findAll({
		where: {
			groupId: {
				in: Util.getGroupIds(req.user, false)
			}
		}
	})
	.then(lunchbreaks => {
		res.send(lunchbreaks)
	})
	.catch(err => {
		res.status(500).send(err)
	})
})

router.route('/:lunchbreakId').get((req, res) => {
	Lunchbreak.findOne({
		where: {
			groupId: {
				and: {
					eq: req.params.lunchbreakId,
					in: Util.getGroupIds(req.user, false)
				}
			}
		}
	})
	.then(lunchbreak => {
		if (lunchbreak) {
			res.send(lunchbreak)
		} else {
			res.status(400).send()
		}
	})
	.catch(err => {
		res.status(500).send(err)
	})
})

router.route('/:lunchbreakId/participants').get((req, res) => {
	Participant.findAll({
		where: {
			lunchbreakId: req.params.lunchbreakId
		},
		attributes: {
			exclude: ['amountSpent']
		},
		include: [ User ]
	})
	.then(participants => {
		res.send(participants)
	})
	.catch(err => {
		res.status(500).send(err)
	})
})

module.exports = router