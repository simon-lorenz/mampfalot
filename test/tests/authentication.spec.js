const Boom = require('@hapi/boom')
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

			it('responds with a well formed token', async () => {
				await request
					.get('/')
					.auth('maxmustermann', '123456')
					.expect(200)
					.expect(res => {
						const token = res.body.token
						const tokenPayload = token.split('.')[1]
						let payload = Buffer.from(tokenPayload, 'base64').toString()
						payload = JSON.parse(payload)
						payload.should.have.all.keys(['id', 'exp', 'iat'])
						payload.id.should.be.equal(1)
					})
			})

			it('fails with 401 if auth header is missing', async () => {
				await request
					.get('/')
					.expect(401)
					.expect(Boom.unauthorized('Missing authentication').output.payload)
			})

			it('fails with 401 on wrong password', async () => {
				await request
					.get('/')
					.auth('maxmustermann', 'wrongPassword')
					.expect(401)
					.expect(Boom.unauthorized('Bad username or password').output.payload)
			})

			it('fails with 401 on unknown username', async () => {
				await request
					.get('/')
					.auth('non-existent-user', 'supersafe')
					.expect(401)
					.expect(Boom.unauthorized('Bad username or password').output.payload)
			})

			it('fails if the user is not verified yet', async () => {
				await request
					.get('/')
					.auth('to-be-verified', 'verifyme')
					.expect(401)
					.expect(Boom.unauthorized('This account is not verified yet').output.payload)
			})
		})
	})
})
