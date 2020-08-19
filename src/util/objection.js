const { Model, initialize, ForeignKeyViolationError, UniqueViolationError, NotFoundError } = require('objection')
const Boom = require('@hapi/boom')
const knex = require('../knex')

module.exports = {
	name: 'objection-plugin',
	register: async server => {
		Model.knex(knex)

		await initialize([
			require('../absence/absence.model'),
			require('../comment/comment.model'),
			require('../group/group.model'),
			require('../group-member/group-member.model'),
			require('../invitation/invitation.model'),
			require('../lunchbreak/lunchbreak.model'),
			require('../participant/participant.model'),
			require('../place/place.model'),
			require('../user/user.model'),
			require('../vote/vote.model')
		])

		server.ext(
			'onPreResponse',
			(request, h) => {
				const { response } = request

				if (response instanceof ForeignKeyViolationError) {
					throw Boom.badRequest(
						'You either provided an invalid foreign key, or tried to delete a resource that is still referenced.'
					)
				}

				if (response instanceof NotFoundError) {
					throw Boom.notFound()
				}

				if (response instanceof UniqueViolationError) {
					if (process.env.NODE_ENV === 'production') {
						throw Boom.badRequest(`Unique constraint violation`)
					} else {
						throw Boom.badRequest(`Unique constraint violation (${response.constraint})`)
					}
				}

				return h.continue
			},
			{ before: ['logging'] }
		)
	}
}
