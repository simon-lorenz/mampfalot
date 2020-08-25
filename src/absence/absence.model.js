const { Model } = require('objection')
const GroupMemberModel = require('../group-member/group-member.model')

class AbsenceModel extends Model {
	static get tableName() {
		return 'absences'
	}

	static get idColumn() {
		return ['lunchbreakId', 'memberId']
	}

	static get relationMappings() {
		return {
			member: {
				relation: Model.BelongsToOneRelation,
				modelClass: GroupMemberModel,
				join: {
					from: 'absences.memberId',
					to: 'group_members.id'
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
}

module.exports = AbsenceModel
