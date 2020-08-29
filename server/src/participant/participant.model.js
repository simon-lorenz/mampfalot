const { Model } = require('objection')

const LunchbreakModel = require('../lunchbreak/lunchbreak.model')

class ParticipantModel extends Model {
	static get tableName() {
		return 'participants'
	}

	static get relationMappings() {
		const GroupMemberModel = require('../group-member/group-member.model')
		const VoteModel = require('../vote/vote.model')
		const PlaceModel = require('../place/place.model')

		return {
			member: {
				relation: Model.BelongsToOneRelation,
				modelClass: GroupMemberModel,
				join: {
					from: 'participants.memberId',
					to: 'group_members.id'
				}
			},
			votes: {
				relation: Model.HasManyRelation,
				modelClass: VoteModel,
				join: {
					from: 'participants.id',
					to: 'votes.participantId'
				}
			},
			result: {
				relation: Model.HasOneRelation,
				modelClass: PlaceModel,
				join: {
					from: 'participants.resultId',
					to: 'places.id'
				}
			},
			lunchbreak: {
				relation: Model.HasOneRelation,
				modelClass: LunchbreakModel,
				join: {
					from: 'participants.lunchbreakId',
					to: 'lunchbreaks.id'
				}
			}
		}
	}

	$formatJson(json) {
		json = super.$formatJson(json)

		delete json.id
		delete json.lunchbreakId
		delete json.memberId
		delete json.resultId

		if (json.lunchbreak) {
			json.date = json.lunchbreak.date
			delete json.lunchbreak
		}

		delete json.member

		return json
	}
}

module.exports = ParticipantModel
