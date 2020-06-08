const PlaceModel = require('./place.model')

class PlaceRepository {
	async placeNameExists(groupId, name) {
		const place = await PlaceModel.findOne({ where: { groupId, name } })
		return place ? true : false
	}
}
module.exports = new PlaceRepository()
