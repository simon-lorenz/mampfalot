const setup = require('../setup')
const errorHelper = require('../helpers/errors')
const util = require('../helpers/util')

module.exports = (request, bearerToken) => {
	return describe('/users', () => {
		describe('GET', () => {
			before(async () => {
				await setup.resetData()
			})

			it('fails if no username is provided', (done) => {
				request
					.get('/users')
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following query values: username')
					})
					.end(done)
			})

			it('returns 404 if no user with this username exists', (done) => {
				const UNKNOWN_USERNAME = 'non-existing-user'
				request
					.get('/users')
					.query({ username: UNKNOWN_USERNAME })
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
					})
					.end(done)
			})

			it('returns a user resource if username exists', (done) => {
				request
					.get('/users')
					.query({ username: 'loten' })
					.expect(200)
					.expect(res => {
						let user = res.body

						user.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'verified'])
						user.should.have.property('id').equal(3)
						user.username.should.be.equal('loten')
						user.firstName.should.be.equal('Philipp')
						user.lastName.should.be.equal('Loten')
					})
					.end(done)
			})
		})

		describe('POST', () => {
			let newUser

			beforeEach(async () => {
				newUser = {
					username: 'homer_simpson',
					firstName: 'Homer',
					lastName: 'Simpson',
					email: 'homer@simpson.com',
					password: "springfield"
				}

				await setup.resetData()
			})

			it('inserts a user correctly', async () => {
				await request
					.post('/users')
					.send(newUser)
					.expect(204)

				await request
					.get('/auth')
					.auth(newUser.username, newUser.password)
					.expect(200)
			})

			it('inserts a user without firstName and lastName', async () => {
				newUser.firstName = undefined
				newUser.lastName = undefined

				await request
					.post('/users')
					.send(newUser)
					.expect(204)

				await request
					.get('/auth')
					.auth(newUser.username, newUser.password)
					.expect(200)
			})

			it('does not fail if the email is already known', async () => {
				newUser.email = 'mustermann@gmail.com'

				await request
					.post('/users')
					.send(newUser)
					.expect(204)
			})

			it('requires body values', (done) => {
				request
					.post('/users')
					.set({ Authorization: bearerToken[1] })
					.send({})
					.expect(400)
					.expect(res => {
						let message = 'This request has to provide all of the following body values: username, email, password'
						errorHelper.checkRequestError(res.body, message)
					})
					.end(done)
			})

			it('fails with 400 if no username is provided', (done) => {
				newUser.username = null
				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'username',
							value: null,
							message: 'username cannot be null'
						}
						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if username is empty', (done) => {
				newUser.username = ''
				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'username',
							value: '',
							message: 'username cannot be empty'
						}
						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if the username contains prohibited chars', async () => {
				const PROHIBITED = ['UpperCase', '$pecialchars', 'white space']

				for (let name of PROHIBITED) {
					newUser.username = name
					await request
						.post('/users')
						.send(newUser)
						.expect(400)
						.expect(res => {
							let expectedErrorItem = {
								field: 'username',
								value: newUser.username,
								message: 'username can only contain [a-z-_0-9]'
							}
							errorHelper.checkValidationError(res.body, expectedErrorItem)
						})
				}
			})

			it('fails if username is longer than 255 chars', (done) => {
				newUser.username = util.generateString(256)

				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'username',
							value: newUser.username,
							message: 'The username must contain 3-255 characters'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails if username is shorter than 3 chars', (done) => {
				newUser.username = util.generateString(2)

				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'username',
							value: newUser.username,
							message: 'The username must contain 3-255 characters'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})


			it('fails if username is already taken', (done) => {
				newUser.username = 'maxmustermann'

				request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						let expectedErrorItem = {
							field: 'username',
							value: newUser.username,
							message: 'This username is already taken'
						}

						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
					.end(done)
			})

			it('fails with 400 if password is null', (done) => {
				newUser.password = null

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

			it('fails with 400 if email is null', (done) => {
				newUser.email = null

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
				const INVALID_ADDRESSES = ['email', 'email@', 'email@provider', 'email@provider.', '@provider.com']

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

		})

		describe('/password-reset', () => {
			describe('GET', () => {
				before(async () => {
					await setup.resetData()
				})

				it('fails if the query does not contain an username', (done) => {
					request
						.get('/users/password-reset')
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'This request has to provide all of the following query values: username')
						})
						.end(done)
				})

				it('sends 404 if username is unknown', (done) => {
					const UNKNOWN_USERNAME = 'non-existent-user'
					request
						.get('/users/password-reset')
						.query({ username: UNKNOWN_USERNAME })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
						})
						.end(done)
				})

				it('sends 204 if username is known', (done) => {
					request
						.get('/users/password-reset')
						.query({ username: 'maxmustermann' })
						.expect(204, done)
				})
			})

			describe('POST', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('fails if the body does not contain an username', (done) => {
					request
						.post('/users/password-reset')
						.send({ token: '123', newPassword: '123456789' })
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token, newPassword')
						})
						.end(done)
				})

				it('fails if the body does not contain a resetToken', (done) => {
					request
						.post('/users/password-reset')
						.send({ username: 'maxmustermann', newPassword: '123456789' })
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token, newPassword')
						})
						.end(done)
				})

				it('fails if the body does not contain a new password', (done) => {
					request
						.post('/users/password-reset')
						.send({ username: 'maxmustermann', token: '123' })
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token, newPassword')
						})
						.end(done)
				})

				it('fails with 404 on unknown user', (done) => {
					const UNKNOWN_USERNAME = 'non-existent-use'
					request
						.post('/users/password-reset')
						.send({ username: UNKNOWN_USERNAME, token: 'my-invalid-token', newPassword: 'supersafe123456'})
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
						})
						.end(done)
				})

				it('fails on invalid credentials', async () => {
					await request
						.get('/users/password-reset')
						.query({ username: 'maxmustermann' })
						.expect(204)

					await request
						.post('/users/password-reset')
						.send({ username: 'maxmustermann', token: '123', newPassword: '123456789'})
						.expect(res => {
							errorHelper.checkAuthenticationError(res.body, 'invalidCredentials')
						})
				})
			})
		})

		describe('/verify', () => {
			describe('GET', () => {
				before(async () => {
					await setup.resetData()
				})

				it('fails if the query does not contain an username', (done) => {
					request
						.get('/users/verify')
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'This request has to provide all of the following query values: username')
						})
						.end(done)
				})

				it('sends 404 if username is unknown', (done) => {
					const UNKNOWN_USERNAME = 'non-existent-user'
					request
						.get('/users/verify')
						.query({ username: UNKNOWN_USERNAME })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
						})
						.end(done)
				})

				it('sends 204 if username is known', (done) => {
					request
						.get('/users/verify')
						.query({ username: 'maxmustermann' })
						.expect(204, done)
				})
			})

			describe('POST', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('fails if the body does not contain an username', (done) => {
					request
						.post('/users/verify')
						.send({ token: '123' })
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token')
						})
						.end(done)
				})

				it('fails if the body does not contain an token', (done) => {
					request
						.post('/users/verify')
						.send({ username: 'maxmustermann' })
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token')
						})
						.end(done)
				})

				it('fails with invalid credentials', async () => {
					await request
						.get('/users/verify')
						.query({ username: 'maxmustermann' })
						.expect(204)

					await request
						.post('/users/verify')
						.send({ username: 'maxmustermann', token: '123456' })
						.expect(res => {
							errorHelper.checkAuthenticationError(res.body, 'invalidCredentials')
						})
				})

				it('fails with 404 on unknown user', (done) => {
					const UNKNOWN_USERNAME = 'non-existent-use'
					request
						.post('/users/verify')
						.send({ username: UNKNOWN_USERNAME, token: 'my-invalid-token'})
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
						})
						.end(done)
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
							user.should.have.all.keys(['id', 'username', 'email', 'firstName', 'lastName', 'verified', 'createdAt', 'updatedAt'])
							user.id.should.be.equal(1)
							user.username.should.be.equal('maxmustermann')
							user.email.should.be.equal('mustermann@gmail.com')
							user.firstName.should.be.equal('Max')
							user.lastName.should.be.equal('Mustermann')
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
							user.should.have.all.keys(['id', 'username', 'email', 'firstName', 'lastName', 'verified', 'createdAt', 'updatedAt'])
							user.id.should.be.equal(3)
							user.username.should.be.equal('loten')
							user.email.should.be.equal('philipp.loten@company.com')
							user.firstName.should.be.equal('Philipp')
							user.lastName.should.be.equal('Loten')
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
						.send({ firstName: 'Neuer', lastName: 'Name', email: 'neu@mail.com', password: 'hurdurdur'})
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
						.send({ firstName: 'New', lastName: 'name' })
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
							errorHelper.checkRequestError(res.body, 'This request has to provide at least one of the following body values: username, firstName, lastName, email, password')
						})
						.end(done)
				})

				it('fails if request does not contain the current password', (done) => {
					request
						.post('/users/1')
						.set({ Authorization: bearerToken[1] })
						.send({ password: 'new!' })
						.expect(400)
						.expect(res => {
							errorHelper.checkRequestError(res.body, 'You need to provide your current password to change it.')
						})
						.end(done)
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

				it('updates a user correctly', async () => {
					await request
						.post('/users/1')
						.set({ Authorization: bearerToken[1] })
						.send({ username: 'fancy-new-name', firstName: 'Neuer', lastName: 'Name', email: 'neu@mail.com', password: 'hurdurdur', currentPassword: '123456'})
						.expect(200)
						.expect(res => {
							let newUser = res.body
							newUser.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'email', 'verified', 'createdAt', 'updatedAt'])
							newUser.should.have.property('id').equal(1)
							newUser.should.have.property('username').equal('fancy-new-name')
							newUser.should.have.property('firstName').equal('Neuer')
							newUser.should.have.property('lastName').equal('Name')
							newUser.should.have.property('email').equal('neu@mail.com')
						})

					await request
						.get('/auth')
						.auth('fancy-new-name', 'hurdurdur')
						.expect(200)
				})

				it('successfully sets firstName and lastName to empty strings', (done) => {
					request
						.post('/users/1')
						.set({ Authorization: bearerToken[1] })
						.send({ firstName: '', lastName: '' })
						.expect(200)
						.expect(res => {
							let user = res.body
							user.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'email', 'verified', 'createdAt', 'updatedAt'])
							user.should.have.property('id').equal(1)
							user.should.have.property('username').equal('maxmustermann')
							user.should.have.property('firstName').equal('')
							user.should.have.property('lastName').equal('')
							user.should.have.property('email').equal('mustermann@gmail.com')
						})
						.end(done)
				})

				it('does not hash the password again if it has not changed', async () => {
					await request
						.post('/users/1')
						.set({ Authorization: bearerToken[1]})
						.send({ username: 'fancy-new-name', firstName: 'Neuer', lastName: 'Name', email: 'neu@mail.com'})
						.expect(200)
						.expect(res => {
							let newUser = res.body
							newUser.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'email', 'verified', 'createdAt', 'updatedAt'])
							newUser.should.have.property('id').equal(1)
							newUser.should.have.property('firstName').equal('Neuer')
							newUser.should.have.property('lastName').equal('Name')
							newUser.should.have.property('email').equal('neu@mail.com')
						})

					await request
						.get('/auth')
						.auth('fancy-new-name', '123456')
						.expect(200)
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

				it('deletes all group memberships of this user', async () => {
					await request
						.delete('/users/2')
						.set({ Authorization: bearerToken[2] })
						.expect(204)

					await request
						.get('/groups/1/members')
						.set({ Authorization: bearerToken[1] })
						.expect(res => {
							let members = res.body
							members.should.be.an('array').with.lengthOf(1)
							members[0].should.have.property('id').equal(1)
						})
				})

				it('sets the foreign key on all associated comments to null', async () => {
					await request
						.delete('/users/2')
						.set({ Authorization: bearerToken[2] })
						.expect(204)

					await request
						.get('/comments/3')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							let comment = res.body
							comment.should.have.property('userId').equal(null)
						})
				})

				it('sets the foreign key on all associated participants to null', async () => {
					await request
						.delete('/users/2')
						.set({ Authorization: bearerToken[2] })
						.expect(204)

					await request
						.get('/participants/2')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							let participant = res.body
							participant.should.have.property('userId').equal(null)
						})
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
							group.should.have.property('members').which.is.an('array').with.lengthOf(2)
							group.should.have.property('lunchbreaks').which.is.an('array')
							group.should.have.property('places').which.is.an('array')
							group.should.have.property('foodTypes').which.is.an('array')

							const member = group.members[0]
							member.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'config'])
						})
						.end(done)
				})
			})
		})
	})
}
