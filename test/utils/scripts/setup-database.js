require('dotenv').config()

const { sequelize } = require('../../../src/sequelize')
const AbsenceModel = require('../../../src/absence/absence.model')
const CommentModel = require('../../../src/comment/comment.model')
const GroupModel = require('../../../src/group/group.model')
const GroupMemberModel = require('../../../src/group-member/group-member.model')
const InvitationModel = require('../../../src/invitation/invitation.model')
const LunchbreakModel = require('../../../src/lunchbreak/lunchbreak.model')
const UserModel = require('../../../src/user/user.model')
const VoteModel = require('../../../src/vote/vote.model')
const ParticipantModel = require('../../../src/participant/participant.model')
const PlaceModel = require('../../../src/place/place.model')

const data = require('./test-data')
const bcrypt = require('bcryptjs')

module.exports = async function resetData() {
	await sequelize.sync({ force: true })

	try {
		await UserModel.bulkCreate(
			data.users.map(user => {
				const result = Object.assign({}, user)
				result.password = bcrypt.hashSync(user.password, 1)
				return result
			})
		)
		await GroupModel.bulkCreate(data.groups)
		await GroupMemberModel.bulkCreate(data.groupMembers)
		await InvitationModel.bulkCreate(data.invitations)
		await PlaceModel.bulkCreate(data.places)
		await LunchbreakModel.bulkCreate(data.lunchbreaks)
		await ParticipantModel.bulkCreate(data.participants)
		await AbsenceModel.bulkCreate(data.absences)
		await VoteModel.bulkCreate(data.votes)
		await CommentModel.bulkCreate(data.comments)

		// The test data gets inserted with explicit primary keys.
		// As a result, the postgres autoincrement/serial won't get incremented and we'll get
		// conflicts when we try to insert new rows without manually setting the id.
		// The following lines update the serials sequence value to prevent these conflicts.
		await sequelize.query('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));')
		await sequelize.query('SELECT setval(\'groups_id_seq\', (SELECT MAX(id) from "groups"));')
		await sequelize.query('SELECT setval(\'group_members_id_seq\', (SELECT MAX(id) from "group_members"));')
		await sequelize.query('SELECT setval(\'invitations_id_seq\', (SELECT MAX(id) from "invitations"));')
		await sequelize.query('SELECT setval(\'places_id_seq\', (SELECT MAX(id) from "places"));')
		await sequelize.query('SELECT setval(\'lunchbreaks_id_seq\', (SELECT MAX(id) from "lunchbreaks"));')
		await sequelize.query('SELECT setval(\'participants_id_seq\', (SELECT MAX(id) from "participants"));')
		await sequelize.query('SELECT setval(\'absences_id_seq\', (SELECT MAX(id) from "absences"));')
		await sequelize.query('SELECT setval(\'votes_id_seq\', (SELECT MAX(id) from "votes"));')
		await sequelize.query('SELECT setval(\'comments_id_seq\', (SELECT MAX(id) from "comments"));')
	} catch (error) {
		console.log(error)
		throw error
	}
}
