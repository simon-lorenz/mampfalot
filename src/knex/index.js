const Knex = require('knex')
const { DATABASE_URL } = process.env

module.exports = Knex({
	client: 'pg',
	connection: DATABASE_URL,
	seeds: {
		directory: `${__dirname}/seeds`
	},
	migrations: {
		directory: `${__dirname}/migrations`
	}
})
