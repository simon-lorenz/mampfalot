const { Model } = require('objection')

const GroupModel = require('../group/group.model')

class InvitationModel extends Model {
	static get tableName() {
		return 'invitations'
	}

	static get relationMappings() {
		const UserModel = require('../user/user.model')

		return {
			group: {
				relation: Model.BelongsToOneRelation,
				modelClass: GroupModel,
				join: {
					from: 'invitations.groupId',
					to: 'groups.id'
				}
			},
			from: {
				relation: Model.BelongsToOneRelation,
				modelClass: UserModel,
				modify: 'public',
				join: {
					from: 'invitations.fromId',
					to: 'users.id'
				}
			},
			to: {
				relation: Model.BelongsToOneRelation,
				modelClass: UserModel,
				modify: 'public',
				join: {
					from: 'invitations.toId',
					to: 'users.id'
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

		delete json.id
		delete json.groupId
		delete json.fromId
		delete json.toId
		delete json.createdAt
		delete json.updatedAt

		return json
	}
}

module.exports = InvitationModel
