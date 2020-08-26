const { expect } = require('chai')

module.exports = {
	generateString(len) {
		let text = ''
		const possible = 'abcdefghijklmnopqrstuvwxyz0123456789'

		for (let i = 0; i < len; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length))
		}

		return text
	},
	expectTimestampUpdated(timestamp) {
		expect(timestamp).to.not.be.null
		expect(new Date(timestamp).getFullYear()).to.equal(new Date().getFullYear())
		expect(new Date(timestamp).getMonth()).to.equal(new Date().getMonth())
		expect(new Date(timestamp).getDate()).to.equal(new Date().getDate())
		expect(new Date(timestamp).getHours()).to.equal(new Date().getHours())
		expect(new Date(timestamp).getMinutes()).to.equal(new Date().getMinutes())
	}
}
