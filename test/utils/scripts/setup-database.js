require('dotenv').load()

const {
	User,
	Group,
	GroupMembers,
	Lunchbreak,
	Place,
	Participant,
	Vote,
	Comment,
	Invitation } = require('../../../models')
const db = require('../../../models').sequelize
const data = require('./test-data')
const bcrypt = require('bcryptjs')

module.exports = async function resetData() {
	process.env.SEEDING = 'true'
	await db.sync({ force: true })

	try {
		await User.bulkCreate(data.users.map(user => {
			const result = Object.assign({}, user)
			result.password = bcrypt.hashSync(user.password, 1)
			return result
		}))
		await Group.bulkCreate(data.groups)
		await GroupMembers.bulkCreate(data.groupMembers)
		await Invitation.bulkCreate(data.invitations)
		await Place.bulkCreate(data.places)
		await Lunchbreak.bulkCreate(data.lunchbreaks)
		await Participant.bulkCreate(data.participants)
		await Vote.bulkCreate(data.votes)
		await Comment.bulkCreate(data.comments)

		// The test data gets inserted with explicit primary keys.
		// As a result, the postgres autoincrement/serial won't get incremented and we'll get
		// conflicts when we try to insert new rows without manually setting the id.
		// The following lines update the serials sequence value to prevent these conflicts.
		await db.query('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));')
		await db.query('SELECT setval(\'groups_id_seq\', (SELECT MAX(id) from "groups"));')
		await db.query('SELECT setval(\'group_members_id_seq\', (SELECT MAX(id) from "group_members"));')
		await db.query('SELECT setval(\'invitations_id_seq\', (SELECT MAX(id) from "invitations"));')
		await db.query('SELECT setval(\'places_id_seq\', (SELECT MAX(id) from "places"));')
		await db.query('SELECT setval(\'lunchbreaks_id_seq\', (SELECT MAX(id) from "lunchbreaks"));')
		await db.query('SELECT setval(\'participants_id_seq\', (SELECT MAX(id) from "participants"));')
		await db.query('SELECT setval(\'votes_id_seq\', (SELECT MAX(id) from "votes"));')
		await db.query('SELECT setval(\'comments_id_seq\', (SELECT MAX(id) from "comments"));')

		process.env.SEEDING = ''
	} catch (error) {
		console.log(error)
		throw error
	}
}
