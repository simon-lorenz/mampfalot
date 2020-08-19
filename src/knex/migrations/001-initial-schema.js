exports.up = async knex => {
	await knex.schema.createTable('users', table => {
		table.increments('id').primary()
		table.string('username').notNullable()
		table.string('firstName')
		table.string('lastName')
		table.string('email').notNullable()
		table.string('password').notNullable()
		table.boolean('verified')
		table.string('verificationToken')
		table.string('passwordResetToken')
		table.datetime('passwordResetExpiration')
		table.datetime('createdAt').notNullable()
		table.datetime('updatedAt')

		table.unique('username')
		table.unique('email')
	})

	await knex.schema.createTable('groups', table => {
		table.increments('id').primary()
		table.string('name').notNullable()
		table.time('lunchTime').notNullable()
		table.time('voteEndingTime').notNullable()
		table.integer('utcOffset').notNullable()
		table.integer('pointsPerDay').notNullable()
		table.integer('maxPointsPerVote').notNullable()
		table.integer('minPointsPerVote').notNullable()
	})

	await knex.schema.createTable('places', table => {
		table.increments('id').primary()
		table.integer('groupId').notNullable()
		table.string('name').notNullable()
		table.string('foodType').notNullable()

		table.unique(['groupId', 'name'], 'uniquePlacePerGroup')

		table
			.foreign('groupId')
			.references('groups.id')
			.onDelete('CASCADE')
	})

	await knex.schema.createTable('group_members', table => {
		table.increments('id').primary()
		table.integer('userId').notNullable()
		table.integer('groupId').notNullable()
		table.boolean('isAdmin').notNullable()
		table.string('color')

		table
			.foreign('userId')
			.references('users.id')
			.onDelete('CASCADE')

		table
			.foreign('groupId')
			.references('groups.id')
			.onDelete('CASCADE')
	})

	await knex.schema.createTable('lunchbreaks', table => {
		table.increments('id').primary()
		table.integer('groupId').notNullable()
		table.date('date').notNullable()

		table.unique(['groupId', 'date'], 'oneLunchbreakPerDayPerGroup')

		table
			.foreign('groupId')
			.references('groups.id')
			.onDelete('CASCADE')
	})

	await knex.schema.createTable('absences', table => {
		table.integer('memberId').notNullable()
		table.integer('lunchbreakId').notNullable()

		table.unique(['memberId', 'lunchbreakId'], 'onlyOneAbsencePerLunchbreak')

		table
			.foreign('memberId')
			.references('group_members.id')
			.onDelete('CASCADE')

		table
			.foreign('lunchbreakId')
			.references('lunchbreaks.id')
			.onDelete('CASCADE')
	})

	await knex.schema.createTable('comments', table => {
		table.increments('id').primary()
		table.integer('lunchbreakId').notNullable()
		table.integer('memberId')
		table.text('text').notNullable()
		table.datetime('createdAt').notNullable()
		table.datetime('updatedAt')

		table
			.foreign('lunchbreakId')
			.references('lunchbreaks.id')
			.onDelete('CASCADE')

		table
			.foreign('memberId')
			.references('group_members.id')
			.onDelete('SET NULL')
	})

	await knex.schema.createTable('invitations', table => {
		table.increments('id').primary()
		table.integer('groupId').notNullable()
		table.integer('fromId')
		table.integer('toId').notNullable()
		table.datetime('createdAt').notNullable()
		table.datetime('updatedAt')

		table.unique(['groupId', 'toId'], 'inviteOnce')

		table
			.foreign('groupId')
			.references('groups.id')
			.onDelete('CASCADE')

		table
			.foreign('fromId')
			.references('users.id')
			.onDelete('SET NULL')

		table
			.foreign('toId ')
			.references('users.id')
			.onDelete('CASCADE')
	})

	await knex.schema.createTable('participants', table => {
		table.increments('id').primary()
		table.integer('lunchbreakId').notNullable()
		table.integer('memberId')
		table.integer('resultId')
		table.float('amountSpent', 10, 2)

		table.unique(['lunchbreakId', 'memberId'], 'participateOnlyOnce')

		table
			.foreign('lunchbreakId')
			.references('lunchbreaks.id')
			.onDelete('CASCADE')

		table
			.foreign('memberId')
			.references('group_members.id')
			.onDelete('SET NULL')

		table
			.foreign('resultId')
			.references('places.id')
			.onDelete('SET NULL')
	})

	await knex.schema.createTable('votes', table => {
		table.increments('id').primary()
		table.integer('participantId').notNullable()
		table.integer('placeId').notNullable()
		table.integer('points').notNullable()

		table
			.foreign('participantId')
			.references('participants.id')
			.onDelete('CASCADE')

		table
			.foreign('placeId')
			.references('places.id')
			.onDelete('CASCADE')
	})
}

exports.down = async knex => {
	await knex.schema.dropTableIfExists('votes')
	await knex.schema.dropTableIfExists('participants')
	await knex.schema.dropTableIfExists('invitations')
	await knex.schema.dropTableIfExists('comments')
	await knex.schema.dropTableIfExists('absences')
	await knex.schema.dropTableIfExists('lunchbreaks')
	await knex.schema.dropTableIfExists('group_members')
	await knex.schema.dropTableIfExists('places')
	await knex.schema.dropTableIfExists('groups')
	await knex.schema.dropTableIfExists('users')
}
