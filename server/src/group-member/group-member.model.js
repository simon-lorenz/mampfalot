const Boom = require('@hapi/boom')
const { Model } = require('objection')

class GroupMemberModel extends Model {
	static get tableName() {
		return 'group_members'
	}

	static get relationMappings() {
		const UserModel = require('../user/user.model')
		const GroupModel = require('../group/group.model')
		const ParticipantModel = require('../participant/participant.model')

		return {
			user: {
				relation: Model.HasOneRelation,
				modelClass: UserModel,
				join: {
					from: 'group_members.userId',
					to: 'users.id'
				}
			},
			participations: {
				relation: Model.HasManyRelation,
				modelClass: ParticipantModel,
				join: {
					from: 'group_members.id',
					to: 'participants.memberId'
				}
			},
			group: {
				relation: Model.BelongsToOneRelation,
				modelClass: GroupModel,
				join: {
					from: 'group_members.groupId',
					to: 'groups.id'
				}
			}
		}
	}

	$formatJson(json) {
		json = super.$formatJson(json)

		if (!json.user) {
			throw Boom.badImplementation('You must join the user.')
		}

		json.config = {
			color: json.color,
			isAdmin: json.isAdmin
		}

		delete json.color
		delete json.isAdmin

		return {
			username: json.user.username,
			firstName: json.user.firstName,
			lastName: json.user.lastName,
			config: json.config
		}
	}
}

module.exports = GroupMemberModel
