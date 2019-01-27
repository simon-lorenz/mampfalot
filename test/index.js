'use strict'

process.env.NODE_ENV = 'test'

const request = require('supertest')('http://localhost:5001/api')
const app = require('./../app')
const setup = require('./setup')
const users = require('./data').users
const chai = require('chai')
const endpoints = require('./helpers/endpoints')
const errorHelper = require('./helpers/errors')
const { AuthenticationErrorTypes } = require('./helpers/errors')

chai.should()

request.getMethodByString = function(method, url) {
	switch (method) {
		case 'GET':
			return this.get(url)

		case 'POST':
			return this.post(url)

		case 'PUT':
			return this.put(url)

		case 'DELETE':
			return this.delete(url)

		default:
			throw new Error(`Unsupported method: ${method}`)

	}
}

describe('The mampfalot api', function () {
	let server
	const bearerToken = []
	this.timeout(10000)

	before(async () => {
		await setup.initialize()
		await setup.resetData()
		server = app.listen(5001)

		let res
		for (const user of users) {
			res = await request
				.get('/auth')
				.auth(user.username, user.password)
			bearerToken[user.id] = `Bearer ${res.body.token}`
		}

		server.close()
	})

	beforeEach(async () => {
		server = app.listen(5001)
	})

	afterEach((done) => {
		server.close()
		done()
	})

	it('responds to /', (done) => {
		request
			.get('/')
			.expect(200, done)
	})

	it('404s unkown routes', (done) => {
		request
			.get('/foo')
			.expect(404)
			.expect(res => {
				const error = res.body
				error.should.have.property('type').which.is.equal('NotFoundError')
				error.should.have.property('message').which.is.equal('This route could not be found.')
			})
			.end(done)
	})

	it('does not send the "x-powered-by" header', (done) => {
		request
			.get('/')
			.expect(res => {
				const headers = res.headers
				headers.should.not.have.property('x-powered-by')
			})
			.end(done)
	})

	it('requires authentication for all protected endpoints', async () => {
		const PROTECTED_ENDPOINTS = endpoints.getProtected()
		const errors = []
		for (const endpoint of PROTECTED_ENDPOINTS) {
			for (const method of endpoint.methods) {
				await request
					.getMethodByString(method, endpoint.url)
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.AUTHENTICTAION_REQUIRED)
					})
					.catch(err => {
						errors.push(`${method} ${endpoint.url}: ${err.message}`)
					})
			}
		}

		if (errors.length > 0) {
			throw new Error(`\n${errors.join('\n')}`)
		}
	})

	it('fails if token is invalid', (done) => {
		const invalid = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6NSwibmFtZSI6Ik1heCBNdXN0ZXJtYW5uIiwiZW1haWwiOiJtdXN0ZXJtYW5uQGdtYWlsLmNvbSIsImlhdCI6MTUzNjc1Njk3MCwiZXhwIjoxNTM2NzYwNTg5LCJqdGkiOiI2YTA5OTY1Ny03MmRlLTQyOGMtOWE2NS00MDQ5N2FmZjY5YjcifQ.Ym0pnoafK1bpBKq_ohqPKyx0mITa_YfkIaHey94wXgQ'
		request
			.get('/users/5')
			.set({ Authorization: invalid })
			.expect(401)
			.expect(res => {
				errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_TOKEN)
			})
			.end(done)
	})

	it('returns correct MethodNotAllowedErrors for all routes', async () => {
		const ENDPOINTS = endpoints.getAll()
		const errors = []
		for (const endpoint of ENDPOINTS) {
			await request
				.patch(endpoint.url)
				.set({ Authorization: bearerToken[1] })
				.expect(405)
				.expect(res => {
					errorHelper.checkMethodNotAllowedError(res.body, 'PATCH', endpoint.methods)
				})
				.catch((err) => {
					errors.push(`${endpoint.url}: ${err.message}`)
				})
		}

		if (errors.length > 0) { throw new Error (`\n${errors.join('\n')}` ) }
	})

	require('./tests/users')(request, bearerToken)
	require('./tests/auth')(request, bearerToken)
	require('./tests/groups')(request, bearerToken)
	require('./tests/places')(request, bearerToken)
	require('./tests/lunchbreaks')(request, bearerToken)
	require('./tests/participants')(request, bearerToken)
	require('./tests/votes')(request, bearerToken)
	require('./tests/comments')(request, bearerToken)
})
