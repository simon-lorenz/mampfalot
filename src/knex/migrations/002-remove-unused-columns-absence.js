exports.up = async knex => {
	await knex.schema.alterTable('absences', table => {
		table.dropColumns(['id', 'createdAt', 'updatedAt'])
	})
}

exports.down = async knex => {
	await knex.schema.alterTable('absences', table => {
		table.integer('id')
		table.datetime('createdAt').notNullable()
		table.datetime('updatedAt')
	})
}
