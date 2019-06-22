'use strict'

const user = require('../classes/user')
const { Place } = require('../models')

class PlaceController {

	async createPlace(groupId, values) {
		const place = Place.build({
			groupId: groupId,
			foodType: values.foodType,
			name: values.name
		})
		await user.can.createPlace(place)
		await place.save()
		return {
			id: place.id,
			name: place.name,
			foodType: place.foodType
		}
	}

	async updatePlace(id, values) {
		const place = await Place.findByPk(id)
		await user.can.updatePlace(place)
		place.foodType = values.foodType,
		place.name = values.name
		await place.save()
		return {
			id: place.id,
			name: place.name,
			foodType: place.foodType
		}
	}

	async deletePlace(id) {
		const place = await Place.findByPk(id)
		await user.can.deletePlace(place)
		await place.destroy()
	}

}

module.exports = new PlaceController
