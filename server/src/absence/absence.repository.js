const AbsenceModel = require('./absence.model')

class AbsenceRepository {
	async getAbsence(lunchbreakId, memberId) {
		return AbsenceModel.query().where({ lunchbreakId, memberId }).first()
	}
}

module.exports = new AbsenceRepository()
