const bcrypt = require('bcryptjs')

const {
	absences,
	groupMembers,
	groups,
	invitations,
	lunchbreaks,
	comments,
	participants,
	votes,
	places,
	users
} = require('.')

exports.seed = async knex => {
	await knex('votes').del()
	await knex('participants').del()
	await knex('invitations').del()
	await knex('comments').del()
	await knex('absences').del()
	await knex('lunchbreaks').del()
	await knex('group_members').del()
	await knex('places').del()
	await knex('groups').del()
	await knex('users').del()

	await knex('users').insert(
		users.map(user => {
			return {
				...user,
				password: bcrypt.hashSync(user.password, 1)
			}
		})
	)

	await knex('groups').insert(groups)
	await knex('places').insert(places)
	await knex('group_members').insert(groupMembers)
	await knex('lunchbreaks').insert(lunchbreaks)
	await knex('absences').insert(absences)
	await knex('comments').insert(comments)
	await knex('invitations').insert(invitations)
	await knex('participants').insert(participants)
	await knex('votes').insert(votes)

	// The test data gets inserted with explicit primary keys.
	// As a result, the postgres autoincrement/serial won't get incremented and we'll get
	// conflicts when we try to insert new rows without manually setting the id.
	// The following lines update the serials sequence value to prevent these conflicts.
	await knex.raw('SELECT setval(\'users_id_seq\', (SELECT MAX(id) from "users"));')
	await knex.raw('SELECT setval(\'groups_id_seq\', (SELECT MAX(id) from "groups"));')
	await knex.raw('SELECT setval(\'places_id_seq\', (SELECT MAX(id) from "places"));')
	await knex.raw('SELECT setval(\'group_members_id_seq\', (SELECT MAX(id) from "group_members"));')
	await knex.raw('SELECT setval(\'lunchbreaks_id_seq\', (SELECT MAX(id) from "lunchbreaks"));')
	await knex.raw('SELECT setval(\'comments_id_seq\', (SELECT MAX(id) from "comments"));')
	await knex.raw('SELECT setval(\'invitations_id_seq\', (SELECT MAX(id) from "invitations"));')
	await knex.raw('SELECT setval(\'participants_id_seq\', (SELECT MAX(id) from "participants"));')
	await knex.raw('SELECT setval(\'votes_id_seq\', (SELECT MAX(id) from "votes"));')
}
