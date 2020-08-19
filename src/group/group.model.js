const { Model } = require('objection')

class GroupModel extends Model {
	static get tableName() {
		return 'groups'
	}

	static get relationMappings() {
		const UserModel = require('../user/user.model')
		const PlaceModel = require('../place/place.model')

		return {
			places: {
				relation: Model.HasManyRelation,
				modelClass: PlaceModel,
				join: {
					from: 'groups.id',
					to: 'places.groupId'
				}
			},
			members: {
				relation: Model.ManyToManyRelation,
				modelClass: UserModel,
				join: {
					from: 'groups.id',
					through: {
						from: 'group_members.groupId',
						to: 'group_members.userId',
						extra: ['color', 'isAdmin']
					},
					to: 'users.id'
				}
			}
		}
	}

	$formatJson(json) {
		json = super.$formatJson(json)

		if (json.members) {
			json.members = json.members.map(member => {
				return {
					username: member.username,
					firstName: member.firstName,
					lastName: member.lastName,
					config: {
						color: member.color,
						isAdmin: member.isAdmin
					}
				}
			})
		}

		return json
	}
}

module.exports = GroupModel
