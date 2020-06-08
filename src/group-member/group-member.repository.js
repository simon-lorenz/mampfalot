const Boom = require('@hapi/boom')
const GroupMemberModel = require('./group-member.model')
const UserModel = require('../user/user.model')

class GroupMemberRepository {
	/**
	 *
	 * @param {Number} groupId
	 * @param {String} username
	 */
	async getMember(groupId, username) {
		const member = await UserModel.findOne({
			attributes: ['id', 'username', 'firstName', 'lastName'],
			where: {
				username
			},
			include: [
				{
					model: GroupMemberModel,
					as: 'config',
					attributes: ['isAdmin', 'color'],
					where: {
						groupId
					}
				}
			]
		})

		if (member) {
			return member.toJSON()
		} else {
			throw Boom.notFound()
		}
	}

	async getMemberId(groupId, username) {
		const member = await GroupMemberModel.findOne({
			attributes: ['id'],
			where: {
				groupId
			},
			include: [
				{
					model: UserModel,
					where: {
						username
					}
				}
			]
		})
		return member.id
	}

	/**
	 * Get a member formatted for the api enduser.
	 * @param {number} groupId
	 * @param {String} username
	 */
	async getMemberFormatted(groupId, username) {
		const member = await this.getMember(groupId, username)
		return {
			username: member.username,
			firstName: member.firstName,
			lastName: member.lastName,
			config: member.config
		}
	}

	async getAdmins(groupId) {
		return GroupMemberModel.findAll({
			where: {
				groupId: groupId,
				isAdmin: true
			}
		})
	}
}

module.exports = new GroupMemberRepository()
