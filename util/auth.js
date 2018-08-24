module.exports = {
	getBasicAuthCredentials: function (basicAuthorizationHeader) {
		// Header-Aufbau: 'Basic <base64String>'
		// Wir wollen nur den b64-String und splitten deshalb beim Leerzeichen
		let credentialsB64 = basicAuthorizationHeader.split(' ')[1]
		let credentials = new Buffer(credentialsB64, 'base64').toString('utf-8') // Enthält nun email:password

		let splitted = credentials.split(':')

		let email = splitted[0]

		// Falls das Passwort Doppelpunkte enthält, wurde das Array öfter als 1x gesplittet
		// Deshalb holen wir uns hier alles hinter der E-Mail und joinen ggf.
		let password = splitted.slice(1, splitted.length).join(':')

		return { email, password }
	}
}