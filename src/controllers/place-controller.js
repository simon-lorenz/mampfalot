const Boom = require('@hapi/boom')
const { Place } = require('../models')
const { placeNameExists } = require('../repositories/place-repository')

async function createPlace(request, h) {
	const { groupId } = request.params
	const { payload } = request

	if (await placeNameExists(groupId, payload.name)) {
		throw Boom.badRequest('A place with this name already exists')
	}

	const place = await Place.create({
		...payload,
		groupId
	})

	// TODO: Remove field at model layer (custom toJSON())
	return h
		.response({
			...place.toJSON(),
			groupId: undefined
		})
		.code(201)
}

async function updatePlace(request, h) {
	const { groupId, placeId } = request.params
	const { payload } = request

	if (await placeNameExists(groupId, payload.name)) {
		throw Boom.badRequest('A place with this name already exists')
	}

	const [affectedRows, [place]] = await Place.update(payload, {
		where: { id: placeId },
		returning: true
	})

	if (affectedRows === 0) {
		throw Boom.notFound()
	}

	// TODO: Remove field at model layer (custom toJSON())
	return {
		...place.toJSON(),
		groupId: undefined
	}
}

async function deletePlace(request, h) {
	const { placeId } = request.params

	const affectedRows = await Place.destroy({ where: { id: placeId } })

	if (affectedRows === 0) {
		throw Boom.notFound()
	}

	return h.response().code(204)
}

module.exports = {
	createPlace,
	updatePlace,
	deletePlace
}
