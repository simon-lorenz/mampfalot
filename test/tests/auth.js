const errorHelper = require('../helpers/errors')

module.exports = (request, token) => {
	return describe('/auth', () => {
		describe('GET', () => {
			it('authenticates a user with correct credentials', (done) => {
				request
					.get('/auth')
					.auth('maxmustermann', '123456')
					.expect(200, done)
			})

			it('authenticates a user with umlauts in his username', (done) => {
				request
					.get('/auth')
					.auth('björn_tietgen', 'test')
					.expect(200, done)
			})

			it('authenticates a user with owasp special chars in his password', (done) => {
				request
					.get('/auth')
					.auth('luisa-rogers', ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~')
					.expect(200, done)
			})

			it('responds with a well formed token', (done) => {
				request
					.get('/auth')
					.auth('maxmustermann', '123456')
					.expect(200)
					.expect(res => {
						let token = res.body.token
						let tokenPayload = token.split('.')[1]
						let payload = Buffer.from(tokenPayload, 'base64').toString()
						payload = JSON.parse(payload)
						payload.should.have.all.keys(['id', 'exp', 'iat'])
						payload.id.should.be.equal(1)
					})
					.end(done)
			})

			it('fails with 401 if auth header is missing', (done) => {
				request
					.get('/auth')
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, 'authRequired')
					})
					.end(done)
			})

			it('fails with 401 on wrong password', (done) => {
				request
					.get('/auth')
					.auth('maxmustermann', 'wrongPassword')
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, 'invalidCredentials')
					})
					.end(done)
			})

			it('fails with 401 on unknown username', (done) => {
				request
					.get('/auth')
					.auth('non-existent-user', 'supersafe')
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, 'invalidCredentials')
					})
					.end(done)
			})
		})
	})
}