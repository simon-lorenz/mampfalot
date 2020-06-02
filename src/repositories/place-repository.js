const { Place } = require('../models')

async function placeNameExists(groupId, name) {
	const place = await Place.findOne({ where: { groupId, name } })
	return place ? true : false
}

module.exports = {
	placeNameExists
}
