const { Absence } = require('../models')

class AbsenceRepository {
	async getAbsence(lunchbreakId, memberId) {
		return Absence.findOne({
			where: {
				lunchbreakId,
				memberId
			}
		})
	}
}

module.exports = new AbsenceRepository()
