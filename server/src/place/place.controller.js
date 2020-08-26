const PlaceModel = require('./place.model')

async function createPlace(request, h) {
	const { groupId } = request.params
	const { payload } = request

	const place = await PlaceModel.query()
		.insert({
			...payload,
			groupId
		})
		.returning('*')

	return h.response(place).code(201)
}

async function updatePlace(request, h) {
	const { placeId } = request.params
	const { payload } = request

	return PlaceModel.query()
		.throwIfNotFound()
		.update(payload)
		.where({ id: placeId })
		.returning('*')
		.first()
}

async function deletePlace(request, h) {
	const { placeId } = request.params

	await PlaceModel.query()
		.throwIfNotFound()
		.delete()
		.where({ id: placeId })

	return h.response().code(204)
}

module.exports = {
	createPlace,
	updatePlace,
	deletePlace
}
