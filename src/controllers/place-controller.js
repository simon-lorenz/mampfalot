const { Place } = require('../models')
const { AuthorizationError } = require('../util/errors')

class PlaceController {
	constructor(user) {
		this.user = user
	}

	async createPlace(groupId, values) {
		const place = Place.build({
			groupId: groupId,
			foodType: values.foodType,
			name: values.name
		})

		if (!this.user.isGroupAdmin(groupId)) {
			throw new AuthorizationError('Place', null, 'CREATE')
		}

		await place.save()
		return {
			id: place.id,
			name: place.name,
			foodType: place.foodType
		}
	}

	async updatePlace(id, values) {
		const place = await Place.findByPk(id)
		if (!this.user.isGroupAdmin(place.groupId)) {
			throw new AuthorizationError('Place', place.id, 'UPDATE')
		}

		place.foodType = values.foodType
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

		if (!this.user.isGroupAdmin(place.groupId)) {
			throw new AuthorizationError('Place', place.id, 'DELETE')
		}

		await place.destroy()
	}
}

module.exports = PlaceController
