const { Model } = require('objection')

class VoteModel extends Model {
	static get tableName() {
		return 'votes'
	}

	static get relationMappings() {
		const PlaceModel = require('../place/place.model')

		return {
			place: {
				relation: Model.BelongsToOneRelation,
				modelClass: PlaceModel,
				join: {
					from: 'votes.placeId',
					to: 'places.id'
				}
			}
		}
	}

	$formatJson(json) {
		json = super.$formatJson(json)
		delete json.id
		delete json.participantId
		delete json.placeId
		return json
	}
}

module.exports = VoteModel
