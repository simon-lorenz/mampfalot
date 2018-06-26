const User = require('./../../models').User
const Group = require('./../../models').Group
const GroupMembers = require('./../../models').GroupMembers
const Lunchbreak = require('./../../models').Lunchbreak
const db = require('./../../models').sequelize

let data = {
	users: require('./users'),
	groups: require('./groups'),
	groupMembers: require('./groupMembers'),
	lunchbreaks: require('./lunchbreaks')
}

module.exports = {
	async setupDatabase() {
		await db.sync({ force: true})
		await User.bulkCreate(data.users)
		await Group.bulkCreate(data.groups)
		await GroupMembers.bulkCreate(data.groupMembers)
		await Lunchbreak.bulkCreate(data.lunchbreaks)
	}
}