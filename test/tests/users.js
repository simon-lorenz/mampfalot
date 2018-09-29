const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/users', () => {
		describe('GET', () => {
			before(async () => {
				await setup.resetData()
			})

			it('fails if no email address is provided', (done) => {
				request
					.get('/users')
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following query values: email')
					})
					.end(done)
			})

			it('returns 404 if no user with this email exists', (done) => {
				request
					.get('/users')
					.query({ email: 'not.existing@email.com' })
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', null)
					})
					.end(done)
			})

			it('returns a user resource if email exists', (done) => {
				request
					.get('/users')
					.query({ email: 'philipp.loten@company.com' })
					.expect(200)
					.expect(res => {
						let user = res.body
						user.should.have.property('id').equal(3)
						user.should.have.property('name').equal('Philipp Loten')
						user.should.have.property('email').equal('philipp.loten@company.com')
						user.should.not.have.property('password')
					})
					.end(done)
			})
		})

		describe('POST', () => {
			let newUser

			beforeEach(async () => {
				newUser = {
					name: 'Homer Simpson',
					email: 'homer@simpson.com',
					password: "springfield"
				}
				await setup.resetData()
			})

			it('inserts a user correctly', (done) => {
				request
					.post('/users')
					.send(newUser)
					.expect(200, (err, res) => {
						let user = res.body
						user.should.have.all.keys(['id', 'name', 'email', 'createdAt', 'updatedAt'])
						user.should.have.property('id')
						user.should.have.property('name').equal(newUser.name)
						user.should.have.property('email').equal(newUser.email)

						request
							.get('/auth')
							.auth(newUser.email, newUser.password)
							.expect(200, done)
					})
			})

			it('fails with 400 if no name is provided', (done) => {
				newUser.name = undefined

				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'name',
							value: null,
							message: 'Name cannot be null'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if name is empty', (done) => {
				newUser.name = ''
				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'name',
							value: '',
							message: 'Name cannot be empty'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if no password is provided', (done) => {
				newUser.password = undefined

				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'password',
							value: null,
							message: 'Password cannot be null'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if password is empty', (done) => {
				newUser.password = ''
				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'password',
							value: '',
							message: 'Password cannot be empty'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails if password is too short', (done) => {
				newUser.password = '1234567'
				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'password',
							value: newUser.password,
							message: 'Password has to be between 8 and 255 characters long'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails if password is too long', (done) => {
				newUser.password =  'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'123456' // 256 characters
				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'password',
							value: newUser.password,
							message: 'Password has to be between 8 and 255 characters long'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if no email is provided', (done) => {
				newUser.email = undefined

				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'email',
							value: null,
							message: 'E-Mail cannot be null'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if email is empty', (done) => {
				newUser.email = ''

				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'email',
							value: '',
							message: 'E-Mail cannot be empty'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if value is no valid email', async () => {
				const INVALID_ADDRESSES = ['123', 'string', 'stringwith@', 'string.com', 'string@test.com&%']

				for (let email of INVALID_ADDRESSES) {
					newUser.email = email
					try {
						await request
							.post('/users')
							.send(newUser)
							.expect(400)
							.expect(res => {
								let expectedErrorItem = {
									field: 'email',
									value: newUser.email,
									message: 'This is not a valid e-mail-address'
								}

								errorHelper.checkValidationError(res.body, expectedErrorItem)
							})
					} catch (err) {
						throw err
					}
				}
			})

			it('fails if email is already taken', (done) => {
				newUser.email = 'mustermann@gmail.com'

				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'email',
							value: newUser.email,
							message: 'This E-Mail is already taken'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})
		})

		describe('/password-reset', () => {
			describe('GET', () => {
				it('fails if the body does not contain an email address', (done) => {
					request
						.get('/users/password-reset')
						.expect(res => {
							errorHelper.checkRequestError(res.body)
						})
						.end(done)
				})

				it('sends 204 if email is unknown', (done) => {
					request
						.get('/users/password-reset')
						.query({ email: 'email@mail.com' })
						.expect(204, done)
				})

				it('sends 204 if email is known', (done) => {
					request
						.get('/users/password-reset')
						.query({ email: 'mustermann@gmail.com' })
						.expect(204, done)
				})
			})
		})

		describe('/:userId', () => {
			describe('GET', () => {
				it('returns a valid user resource for Max Mustermann', (done) => {
					request
						.get('/users/1')
						.set({
							Authorization: bearerToken[1]
						})
						.expect(200)
						.expect(res => {
							let user = res.body
							user.should.have.all.keys(['id', 'name', 'email', 'createdAt', 'updatedAt'])
							user.should.have.property('id').equal(1)
							user.should.have.property('name').equal('Max Mustermann')
							user.should.have.property('email').equal('mustermann@gmail.com')
						})
						.end(done)
				})

				it('returns a valid user resource for Philipp Loten', (done) => {
					request
						.get('/users/3')
						.set({
							Authorization: bearerToken[3]
						})
						.expect(200)
						.expect(res => {
							let user = res.body
							user.should.have.all.keys(['id', 'name', 'email', 'createdAt', 'updatedAt'])
							user.should.have.property('id').equal(3)
							user.should.have.property('name').equal('Philipp Loten')
							user.should.have.property('email').equal('philipp.loten@company.com')
						})
						.end(done)
				})

				it('fails with 403 if user requests a resource other than himself', (done) => {
					request
						.get('/users/3')
						.set({
							Authorization: bearerToken[1]
						})
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'User',
								id: 3,
								operation: 'READ'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})
			})

			describe('POST', () => {
				beforeEach(async() => {
					await setup.resetData()
				})

				it('fails with 404 if user doesn\'t exist', (done) => {
					request
						.post('/users/99')
						.set({ Authorization: bearerToken[1]})
						.send({ name: 'Neuer Name', email: 'neu@mail.com', password: 'hurdurdur'})
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'User', 99)
						})
						.end(done)
				})

				it('fails with 403 if user tries to update another user', (done) => {
					request
						.post('/users/3')
						.set({ Authorization: bearerToken[1]})
						.send({ name: 'New name' })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'User',
								id: 3,
								operation: 'UPDATE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('fails with 400 if not at least one parameter is provided', (done) => {
					request
						.post('/users/1')
						.set({ Authorization: bearerToken[1]})
						.send({})
						.expect(400)
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'This request has to provide at least one of the following body values: name, email, password')
						})
						.end(done)
				})

				it('fails if request does not contain the current password', (done) => {
					request
						.post('/users/1')
						.set({ Authorization: bearerToken[1] })
						.send({ password: 'new!' })
						.expect(400, done)
				})

				it('fails if the current password does not match', (done) => {
					request
						.post('/users/1')
						.set({ Authorization: bearerToken[1] })
						.send({ password: 'new!', currentPassword: 'wrongPassword'})
						.expect(401)
						.expect(res => {
							errorHelper.checkAuthenticationError(res.body, 'invalidCredentials')
						})
						.end(done)
				})

				it('updates a user correctly', (done) => {
					request
						.post('/users/1')
						.set({ Authorization: bearerToken[1]})
						.send({ name: 'Neuer Name', email: 'neu@mail.com', password: 'hurdurdur', currentPassword: '123456'})
						.expect(200)
						.expect(res => {
							let newUser = res.body
							newUser.should.have.all.keys(['id', 'name', 'email', 'createdAt', 'updatedAt'])
							newUser.should.have.property('id').equal(1)
							newUser.should.have.property('name').equal('Neuer Name')
							newUser.should.have.property('email').equal('neu@mail.com')
						})
						.then(() => {
							request
								.get('/auth')
								.auth('neu@mail.com', 'hurdurdur')
								.expect(200, done)
						})
						.catch((err) => {
							done(err)
						})
				})

				it('does not hash the password again if it has not changed', (done) => {
					request
						.post('/users/1')
						.set({ Authorization: bearerToken[1]})
						.send({ name: 'Neuer Name', email: 'neu@mail.com'})
						.expect(200)
						.expect(res => {
							let newUser = res.body
							newUser.should.have.all.keys(['id', 'name', 'email', 'createdAt', 'updatedAt'])
							newUser.should.have.property('id').equal(1)
							newUser.should.have.property('name').equal('Neuer Name')
							newUser.should.have.property('email').equal('neu@mail.com')
						})
						.then(() => {
							request
								.get('/auth')
								.auth('neu@mail.com', '123456')
								.expect(200, done)
						})
						.catch((err) => {
							done(err)
						})
				})
			})

			describe('DELETE', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('fails with 403 if user tries to delete another user', (done) => {
					request
						.delete('/users/5')
						.set({
							Authorization: bearerToken[1]
						})
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'User',
								id: 5,
								operation: 'DELETE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('fails with 404 if user doesn\'t exist', (done) => {
					request
						.delete('/users/99')
						.set({
							Authorization: bearerToken[1]
						})
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'User', 99)
						})
						.end(done)
				})

				it('deletes an existing user', async () => {
					await request
						.delete('/users/3')
						.set({ Authorization: bearerToken[3] })
						.expect(204)

					await request
						.get('/users/3')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})
			})

			describe('/groups', () => {
				before(async () => {
					await setup.resetData()
				})

				it('fails if user tries to access another users groups', (done) => {
					request
						.get('/users/1/groups')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'GroupCollection',
								id: null,
								operation: 'READ'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('sends a correct group collection', (done) => {
					request
						.get('/users/1/groups')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							let groups = res.body
							groups.should.be.an('array').of.length(1)

							let group = groups[0]

							group.should.be.an('object')
							group.should.have.property('id')
							group.should.have.property('name')
							group.should.have.property('defaultLunchTime')
							group.should.have.property('defaultVoteEndingTime')
							group.should.have.property('pointsPerDay')
							group.should.have.property('maxPointsPerVote')
							group.should.have.property('minPointsPerVote')
							group.should.have.property('members').which.is.an('array')
							group.should.have.property('lunchbreaks').which.is.an('array')
							group.should.have.property('places').which.is.an('array')
							group.should.have.property('foodTypes').which.is.an('array')
						})
						.end(done)
				})
			})
		})
	})
}
