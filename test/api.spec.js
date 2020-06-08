const Boom = require('@hapi/boom')
const request = require('supertest')('http://localhost:5001')
const SwaggerParser = require('swagger-parser')
const APIContract = require('./utils/openapi-helper')

describe('The mampfalot api', () => {
	before(() => APIContract.parse())

	it('has a valid openapi contract', async () => {
		await SwaggerParser.validate('./docs/mampfalot.oas3.yaml')
	})

	it('404s unkown routes', async () => {
		await request.get('/foo').expect(404)
	})

	it('does not send the "x-powered-by" header', async () => {
		await request.get('/').expect(res => {
			const headers = res.headers
			headers.should.not.have.property('x-powered-by')
		})
	})

	it('requires authentication for all protected endpoints', async () => {
		await APIContract.parse()

		const urls = APIContract.getUrls()
		const errors = []

		for (const url of urls) {
			const methods = APIContract.getMethods(url)
			for (const method of methods) {
				if (APIContract.requiresBearerToken(url, method) === false) {
					continue
				}

				const testableUrl = APIContract.replaceParams(url)

				try {
					await request[method](testableUrl)
						.expect(401)
						.expect(Boom.unauthorized('Missing authentication').output.payload)
				} catch (error) {
					errors.push(`${method} ${testableUrl}: ${error.message}`)
				}
			}
		}

		if (errors.length > 0) {
			throw new Error(`\n${errors.join('\n')}`)
		}
	})

	it('fails if token is invalid', async () => {
		const invalid =
			'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwibmFtZSI6Ik1heCBNdXN0ZXJtYW5uIiwiZW1haWwiOiJtdXN0ZXJtYW5uQGdtYWlsLmNvbSIsImlhdCI6MTUzNjc1Njk3MCwiZXhwIjoxNTM2NzYwNTg5LCJqdGkiOiI2YTA5OTY1Ny03MmRlLTQyOGMtOWE2NS00MDQ5N2FmZjY5YjcifQ.Ym0pnoafK1bpBKq_ohqPKyx0mITa_YfkIaHey94wXgQ'

		await request
			.get('/groups/1')
			.set({ Authorization: invalid })
			.expect(401)
			.expect(Boom.unauthorized('The provided token is invalid').output.payload)
	})
})
