const { AbsenceController } = require('../controllers')

module.exports = {
	name: 'absence-router',
	register: async server => {
		server.route({
			method: 'POST',
			path: '/groups/{groupId}/lunchbreaks/{date}/absence',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				}
			},
			handler: AbsenceController.createAbsence
		})

		server.route({
			method: 'DELETE',
			path: '/groups/{groupId}/lunchbreaks/{date}/absence',
			options: {
				auth: {
					access: {
						scope: ['member:{params.groupId}', 'admin:{params.groupId}']
					}
				}
			},
			handler: AbsenceController.deleteAbsence
		})
	}
}
