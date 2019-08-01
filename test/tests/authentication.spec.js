const errorHelper = require('../utils/errors')
const { AuthenticationErrorTypes } = require('../utils/errors')
const request = require('supertest')('http://localhost:5001/api/authenticate')

describe('Authentication', () => {
	describe('/authenticate', () => {
		describe('GET', () => {
			it('authenticates a user with correct credentials', async () => {
				await request
					.get('/')
					.auth('maxmustermann', '123456')
					.expect(200)
			})

			it('authenticates a user with umlauts in his username', async () => {
				await request
					.get('/')
					.auth('björn_tietgen', 'test')
					.expect(200)
			})

			it('authenticates a user with owasp special chars in his password', async () => {
				await request
					.get('/')
					.auth('luisa-rogers', ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~')
					.expect(200)
			})

			it('responds with a session cookie', async () => {
				await request
					.get('/')
					.auth('maxmustermann', '123456')
					.expect(200)
					.expect(res => {
						res.headers['set-cookie'].should.be.an('array').with.lengthOf(1)
						const sessionCookie = res.headers['set-cookie'][0]
						sessionCookie.split('=')[0].should.be.equal('session')
						sessionCookie.split('=')[1].should.not.be.empty
					})
			})

			it('fails with 401 if auth header is missing', async () => {
				await request
					.get('/')
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.AUTHENTICTAION_REQUIRED)
					})
			})

			it('fails with 401 on wrong password', async () => {
				await request
					.get('/')
					.auth('maxmustermann', 'wrongPassword')
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_CREDENTIALS)
					})
			})

			it('fails with 401 on unknown username', async () => {
				await request
					.get('/')
					.auth('non-existent-user', 'supersafe')
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_CREDENTIALS)
					})
			})

			it('fails if the user is not verified yet', async () => {
				await request
					.get('/')
					.auth('to-be-verified', 'verifyme')
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.NOT_VERIFIED)
					})
			})
		})
	})
})
