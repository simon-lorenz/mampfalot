module.exports = {
	getBasicAuthCredentials: function (basicAuthorizationHeader) {
		// Header-Aufbau: 'Basic <base64String>'
		// Wir wollen nur den b64-String und splitten deshalb beim Leerzeichen
		let credentialsB64 = basicAuthorizationHeader.split(' ')[1]
		let credentials = new Buffer(credentialsB64, 'base64').toString('ascii') // Enthält nun email:password

		return {
			email: credentials.split(':')[0],
			password: credentials.split(':')[1]
		}
	}
}