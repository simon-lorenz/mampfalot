module.exports = {
	client: 'pg',
	connection: process.env.DATABASE_URL,
	seeds: {
		directory: `${__dirname}/seeds`
	},
	migrations: {
		directory: `${__dirname}/migrations`
	}
}
