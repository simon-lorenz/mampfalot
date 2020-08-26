const { Model } = require('objection')

class UserModel extends Model {
	static get tableName() {
		return 'users'
	}

	static get relationMappings() {
		const GroupModel = require('../group/group.model')

		return {
			groups: {
				relation: Model.ManyToManyRelation,
				modelClass: GroupModel,
				join: {
					from: 'users.id',
					through: {
						from: 'group_members.userId',
						to: 'group_members.groupId',
						extra: ['color', 'isAdmin']
					},
					to: 'groups.id'
				}
			}
		}
	}

	static get modifiers() {
		return {
			public(builder) {
				builder.select(['id', 'username', 'firstName', 'lastName'])
			},

			private(builder) {
				builder.select(['id', 'email', 'username', 'firstName', 'lastName'])
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
		return json
	}
}

module.exports = UserModel
