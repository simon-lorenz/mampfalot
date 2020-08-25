const moment = require('moment')
const { Model } = require('objection')

class LunchbreakModel extends Model {
	static get tableName() {
		return 'lunchbreaks'
	}

	static get relationMappings() {
		const AbsenceModel = require('../absence/absence.model')
		const CommentModel = require('../comment/comment.model')
		const GroupModel = require('../group/group.model')
		const ParticipantModel = require('../participant/participant.model')

		return {
			absent: {
				relation: Model.HasManyRelation,
				modelClass: AbsenceModel,
				join: {
					from: 'lunchbreaks.id',
					to: 'absences.lunchbreakId'
				}
			},
			comments: {
				relation: Model.HasManyRelation,
				modelClass: CommentModel,
				join: {
					from: 'lunchbreaks.id',
					to: 'comments.lunchbreakId'
				}
			},
			group: {
				relation: Model.BelongsToOneRelation,
				modelClass: GroupModel,
				join: {
					from: 'lunchbreaks.groupId',
					to: 'groups.id'
				}
			},
			participants: {
				relation: Model.HasManyRelation,
				modelClass: ParticipantModel,
				join: {
					from: 'lunchbreaks.id',
					to: 'participants.lunchbreakId'
				}
			}
		}
	}

	$formatJson(json) {
		json = super.$formatJson(json)

		if (json.date) {
			json.date = moment(json.date).format('YYYY-MM-DD')
		}

		delete json.groupId

		return json
	}
}

module.exports = LunchbreakModel
