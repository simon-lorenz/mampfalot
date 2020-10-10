const SwaggerParser = require('swagger-parser')

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete']

class OpenAPIHelper {
	async parse() {
		const parsed = await SwaggerParser.parse(`${__dirname}/../../docs/mampfalot.oas3.yaml`)
		this.paths = parsed.paths
	}

	getMethods(url) {
		const result = []

		HTTP_METHODS.forEach(method => {
			if (this.paths[url][method]) {
				result.push(method)
			}
		})
		return result
	}

	requiresBearerToken(url, method) {
		method = method.toLowerCase()

		const securityMeasurements = this.paths[url][method].security

		if (securityMeasurements) {
			return securityMeasurements.find(measurement => measurement.bearerAuth) !== undefined
		} else {
			return false
		}
	}

	getUrls() {
		return Object.keys(this.paths)
	}

	replaceParams(url) {
		url = url.replace('{groupId}', '1')
		url = url.replace('{placeId}', '1')
		url = url.replace('{commentId}', '1')
		url = url.replace('{username}', 'maxmustermann')
		url = url.replace('{date}', '25-06-2018')
		return url
	}
}

module.exports = new OpenAPIHelper()
