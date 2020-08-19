const { Model } = require('objection')

class CommentModel extends Model {
	static get tableName() {
		return 'comments'
	}

	static get relationMappings() {
		const GroupMemberModel = require('../group-member/group-member.model')
		const LunchbreakModel = require('../lunchbreak/lunchbreak.model')

		return {
			author: {
				relation: Model.BelongsToOneRelation,
				modelClass: GroupMemberModel,
				join: {
					from: 'comments.memberId',
					to: 'group_members.id'
				}
			},
			lunchbreak: {
				relation: Model.BelongsToOneRelation,
				modelClass: LunchbreakModel,
				join: {
					from: 'comments.lunchbreakId',
					to: 'lunchbreaks.id'
				}
			}
		}
	}

	$beforeInsert() {
		this.createdAt = new Date()
	}

	$beforeUpdate() {
		this.updatedAt = new Date()
	}

	$formatJson(json) {
		json = super.$formatJson(json)
		delete json.memberId
		delete json.lunchbreakId
		return json
	}
}

module.exports = CommentModel
