const testServer = require('../utils/test-server')
const request = require('supertest')('http://localhost:5001/api')
const SessionHelper = require('../utils/session-helper')
const errorHelper = require('../utils/errors')
const { AuthenticationErrorTypes } = require('../utils/errors')
const SwaggerParser = require('swagger-parser')
const APIContract = require('../utils/openapi-helper')

describe('The test server', () => {
	it('mocks date and time correctly', async ()  => {
		testServer.start(5001, '09:22:33', '05.02.2019')
		await require('supertest')('http://localhost:5001')
			.get('/utc-system-time')
			.expect(res => {
				const systemTime = res.body
				systemTime.should.have.all.keys(['year', 'month', 'day', 'hour', 'minute', 'second'])
				systemTime.year.should.be.equal(2019)
				systemTime.month.should.be.equal(1) // UTC-Months are zero based!
				systemTime.day.should.be.equal(5)
				systemTime.hour.should.be.equal(9)
				systemTime.minute.should.be.equal(22)
				systemTime.second.should.be.equal(33)
			})
		testServer.close()
	})
})

describe('The mampfalot api', () => {

	before(() => APIContract.parse())

	it('has a valid openapi contract', async () => {
		await SwaggerParser.validate('./docs/mampfalot.oas3.yaml')
	})

	it('responds to /', async () => {
		await request
			.get('/')
			.expect(200)
	})

	it('404s unkown routes', async () => {
		await request
			.get('/foo')
			.expect(404)
			.expect(res => {
				const error = res.body
				error.should.have.property('type').which.is.equal('NotFoundError')
				error.should.have.property('message').which.is.equal('This route could not be found.')
			})
	})

	it('does not send the "x-powered-by" header', async () => {
		await request
			.get('/')
			.expect(res => {
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
				if (APIContract.requiresSessionCookie(url, method) === false)
					continue

				const testableUrl = APIContract.replaceParams(url)

				try {
					const res = await request[method](testableUrl)
					res.status.should.be.eql(401)
					errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.AUTHENTICTAION_REQUIRED)
				} catch (error) {
					errors.push(`${method} ${testableUrl}: ${error.message}`)
				}
			}
		}

		if (errors.length > 0)
			throw new Error(`\n${errors.join('\n')}`)
	})

	it('fails if cookie is invalid', async () => {
		const invalid = 'session=123'
		await request
			.get('/users/5')
			.set('cookie', invalid)
			.expect(401)
			.expect(res => {
				errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_SESSION)
			})
	})

	it('returns correct MethodNotAllowedErrors for all routes', async () => {
		const urls = APIContract.getUrls()
		const errors = []

		for (const url of urls) {
			const methods = APIContract.getMethods(url)
			await request
				.patch(url)
				.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
				.expect(405)
				.expect(res => {
					errorHelper.checkMethodNotAllowedError(res.body, 'PATCH', methods.map(method => method.toUpperCase()))
				})
				.catch((err) => {
					errors.push(`${url}: ${err.message}`)
				})
		}

		if (errors.length > 0)
			throw new Error (`\n${errors.join('\n')}` )
	})
})
