const Boom = require('@hapi/boom')
const jwt = require('jsonwebtoken')

const GroupRepository = require('../group/group.repository')
const UserRepository = require('../user/user.repository')

module.exports = {
	name: 'jwt',
	register: async server => {
		server.auth.scheme('jwt', (server, options) => {
			return {
				authenticate: async (request, h) => {
					const authorizationHeader = request.headers['authorization']

					if (!authorizationHeader) {
						throw Boom.unauthorized('Missing authentication')
					}

					const token = authorizationHeader.split(' ')[1]

					try {
						const { id } = jwt.verify(token, options.secret)

						const username = await UserRepository.getUsernameById(id)
						const groups = await GroupRepository.getGroupMembershipsOfUser(id)
						const scope = groups
							.map(group => (group.isAdmin ? `admin:${group.id}` : `member:${group.id}`))
							.concat(`user:${username}`)

						request.logger.debug({ scope }, 'Calculated scope')

						return h.authenticated({
							credentials: {
								id,
								username,
								scope
							}
						})
					} catch (err) {
						request.logger.debug({ err }, 'Token validation failed')
						throw Boom.unauthorized('The provided token is invalid')
					}
				}
			}
		})

		server.auth.strategy('jwt', 'jwt', { secret: process.env.SECRET_KEY })
	}
}
