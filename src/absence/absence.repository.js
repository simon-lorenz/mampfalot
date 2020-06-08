const AbsenceModel = require('./absence.model')

class AbsenceRepository {
	async getAbsence(lunchbreakId, memberId) {
		return AbsenceModel.findOne({
			where: {
				lunchbreakId,
				memberId
			}
		})
	}
}

module.exports = new AbsenceRepository()
