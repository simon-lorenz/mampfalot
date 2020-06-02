module.exports = {
	generateString(len) {
		let text = ''
		const possible = 'abcdefghijklmnopqrstuvwxyz0123456789'

		for (let i = 0; i < len; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length))
		}

		return text
	}
}
