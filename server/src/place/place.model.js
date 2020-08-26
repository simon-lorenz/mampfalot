const { Model } = require('objection')

class PlaceModel extends Model {
	static get tableName() {
		return 'places'
	}

	$formatJson(json) {
		json = super.$formatJson(json)
		delete json.groupId
		return json
	}
}

module.exports = PlaceModel
