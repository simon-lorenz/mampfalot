'use strict'

const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const { AuthenticationErrorTypes } = require('../utils/errors')
const util = require('../utils/util')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')

describe('/users', () => {
	describe('GET', () => {
		before(async () => {
			await setupDatabase()
		})

		it('fails if no username is provided', async () => {
			await request
				.get('/users')
				.expect(400)
				.expect(res => {
					errorHelper.checkRequestError(res.body, 'This request has to provide all of the following query values: username')
				})
		})

		it('returns 404 if no user with this username exists', async () => {
			const UNKNOWN_USERNAME = 'non-existing-user'
			await request
				.get('/users')
				.query({ username: UNKNOWN_USERNAME })
				.expect(404)
				.expect(res => {
					errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
				})
		})

		it('returns a user resource if username exists', async () => {
			await request
				.get('/users')
				.query({ username: 'loten' })
				.expect(200)
				.expect(res => {
					const user = res.body
					user.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'verified'])
					user.should.have.property('id').equal(3)
					user.username.should.be.equal('loten')
					user.firstName.should.be.equal('Philipp')
					user.lastName.should.be.equal('Loten')
				})
		})
	})

	describe('POST', () => {
		let newUser

		beforeEach(async () => {
			newUser = {
				username: 'homer_simpson',
				firstName: 'Homer',
				lastName: 'Simpson',
				email: 'homer@simpson.nonexistenttld',
				password: 'springfield'
			}

			await setupDatabase()
		})

		it('inserts a user correctly', async () => {
			await request
				.post('/users')
				.send(newUser)
				.expect(204)

			await request
				.get('/authenticate')
				.auth(newUser.username, newUser.password)
				.expect(401)
				.expect(res => {
					errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.NOT_VERIFIED)
				})
		})

		it('inserts a user without firstName and lastName', async () => {
			newUser.firstName = undefined
			newUser.lastName = undefined

			await request
				.post('/users')
				.send(newUser)
				.expect(204)

			await request
				.get('/authenticate')
				.auth(newUser.username, newUser.password)
				.expect(401)
				.expect(res => {
					errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.NOT_VERIFIED)
				})
		})

		it('does not fail if the email is already known', async () => {
			newUser.email = 'mustermann@gmail.nonexistenttld'

			await request
				.post('/users')
				.send(newUser)
				.expect(204)
		})

		it('requires body values', async () => {
			await request
				.post('/users')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send({})
				.expect(400)
				.expect(res => {
					const message = 'This request has to provide all of the following body values: username, email, password'
					errorHelper.checkRequestError(res.body, message)
				})
		})

		it('fails with 400 if no username is provided', async () => {
			newUser.username = null
			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'username',
						value: null,
						message: 'username cannot be null'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails with 400 if username is empty', async () => {
			newUser.username = ''
			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'username',
						value: '',
						message: 'username cannot be empty'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails with 400 if the username contains prohibited chars', async () => {
			const PROHIBITED = ['UpperCase', '$pecialchars', 'white space']

			for (const name of PROHIBITED) {
				newUser.username = name
				await request
					.post('/users')
					.send(newUser)
					.expect(400)
					.expect(res => {
						const expectedErrorItem = {
							field: 'username',
							value: newUser.username,
							message: 'username can only contain [a-z-_0-9]'
						}
						errorHelper.checkValidationError(res.body, expectedErrorItem)
					})
			}
		})

		it('fails if username is longer than 255 chars', async () => {
			newUser.username = util.generateString(256)

			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'username',
						value: newUser.username,
						message: 'The username must contain 3-255 characters'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails if username is shorter than 3 chars', async () => {
			newUser.username = util.generateString(2)

			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'username',
						value: newUser.username,
						message: 'The username must contain 3-255 characters'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails if username is already taken', async () => {
			newUser.username = 'maxmustermann'

			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'username',
						value: newUser.username,
						message: 'This username is already taken'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails with 400 if password is null', async () => {
			newUser.password = null

			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'password',
						value: null,
						message: 'Password cannot be null'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails with 400 if password is empty', async () => {
			newUser.password = ''
			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'password',
						value: '',
						message: 'Password cannot be empty'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails if password is too short', async () => {
			newUser.password = '1234567'
			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'password',
						value: newUser.password,
						message: 'Password has to be between 8 and 255 characters long'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails if password is too long', async () => {
			newUser.password =  'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
									'123456' // 256 characters
			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'password',
						value: newUser.password,
						message: 'Password has to be between 8 and 255 characters long'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails with 400 if email is null', async () => {
			newUser.email = null

			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'email',
						value: null,
						message: 'E-Mail cannot be null'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails with 400 if email is empty', async () => {
			newUser.email = ''

			await request
				.post('/users')
				.send(newUser)
				.expect(400)
				.expect(res => {
					const expectedErrorItem = {
						field: 'email',
						value: '',
						message: 'E-Mail cannot be empty'
					}
					errorHelper.checkValidationError(res.body, expectedErrorItem)
				})
		})

		it('fails with 400 if value is no valid email', async () => {
			const INVALID_ADDRESSES = ['email', 'email@', 'email@provider', 'email@provider.', '@provider.com']

			for (const email of INVALID_ADDRESSES) {
				newUser.email = email
				try {
					await request
						.post('/users')
						.send(newUser)
						.expect(400)
						.expect(res => {
							const expectedErrorItem = {
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
				await setupDatabase()
			})

			it('fails if the query does not contain an username', async () => {
				await request
					.get('/users/password-reset')
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following query values: username')
					})
			})

			it('sends 404 if username is unknown', async () => {
				const UNKNOWN_USERNAME = 'non-existent-user'
				await request
					.get('/users/password-reset')
					.query({ username: UNKNOWN_USERNAME })
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
					})
			})

			it('sends 204 if username is known', async () => {
				await request
					.get('/users/password-reset')
					.query({ username: 'maxmustermann' })
					.expect(204)
			})
		})

		describe('POST', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if the body does not contain an username', async () => {
				await request
					.post('/users/password-reset')
					.send({ token: '123', newPassword: '123456789' })
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token, newPassword')
					})
			})

			it('fails if the body does not contain a resetToken', async () => {
				await request
					.post('/users/password-reset')
					.send({ username: 'maxmustermann', newPassword: '123456789' })
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token, newPassword')
					})
			})

			it('fails if the body does not contain a new password', async () => {
				await request
					.post('/users/password-reset')
					.send({ username: 'maxmustermann', token: '123' })
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token, newPassword')
					})
			})

			it('fails with 404 on unknown user', async () => {
				const UNKNOWN_USERNAME = 'non-existent-use'
				await request
					.post('/users/password-reset')
					.send({ username: UNKNOWN_USERNAME, token: 'my-invalid-token', newPassword: 'supersafe123456' })
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
					})
			})

			it('fails on invalid credentials', async () => {
				await request
					.get('/users/password-reset')
					.query({ username: 'maxmustermann' })
					.expect(204)

				await request
					.post('/users/password-reset')
					.send({ username: 'maxmustermann', token: '123', newPassword: '123456789' })
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_CREDENTIALS)
					})
			})
		})
	})

	describe('/verify', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('fails if the query does not contain an username', async () => {
				await request
					.get('/users/verify')
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following query values: username')
					})
			})

			it('sends 404 if username is unknown', async () => {
				const UNKNOWN_USERNAME = 'non-existent-user'
				await request
					.get('/users/verify')
					.query({ username: UNKNOWN_USERNAME })
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
					})
			})

			it('fails if user is already verified', async () => {
				await request
					.get('/users/verify')
					.query({ username: 'maxmustermann' })
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This user is already verified.')
					})
			})

			it('sends 204 if user is unverified', async () => {
				await request
					.get('/users/verify')
					.query({ username: 'to-be-verified' })
					.expect(204)
			})
		})

		describe('POST', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if the body does not contain an username', async () => {
				await request
					.post('/users/verify')
					.send({ token: '123' })
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token')
					})
			})

			it('fails if the body does not contain an token', async () => {
				await request
					.post('/users/verify')
					.send({ username: 'maxmustermann' })
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: username, token')
					})
			})

			it('fails with invalid credentials', async () => {
				await request
					.post('/users/verify')
					.send({ username: 'to-be-verified', token: '123456' })
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_CREDENTIALS)
					})
			})

			it('fails with 404 on unknown user', async () => {
				const UNKNOWN_USERNAME = 'non-existent-use'
				await request
					.post('/users/verify')
					.send({ username: UNKNOWN_USERNAME, token: 'my-invalid-token' })
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', UNKNOWN_USERNAME)
					})
			})

			it('verifies a user successfully', async () => {
				await request
					.get('/authenticate')
					.auth('to-be-verified', 'verifyme')
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.NOT_VERIFIED)
					})

				await request
					.post('/users/verify')
					.send({ username: 'to-be-verified', token: 'valid-token' })
					.expect(204)

				await request
					.get('/authenticate')
					.auth('to-be-verified', 'verifyme')
					.expect(200)
			})
		})
	})

	describe('/forgot-username', () => {
		describe('GET', () => {
			it('requires email parameter', async () => {
				await request
					.get('/users/forgot-username')
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide all of the following query values: email')
					})
			})

			it('sends 204 on non existing email', async () => {
				await request
					.get('/users/forgot-username')
					.query({ email: 'non-existing-address@provider.nonexistenttld' })
					.expect(204)
			})

			it('sends 204 on existing email', async () => {
				await request
					.get('/users/forgot-username')
					.query({ email: 'philipp.loten@company.nonexistenttld' })
					.expect(204)
			})
		})
	})

	describe('/:userId', () => {
		describe('GET', () => {
			it('returns a valid user resource for Max Mustermann', async () => {
				await request
					.get('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const user = res.body
						user.should.have.all.keys(['id', 'username', 'email', 'firstName', 'lastName', 'verified', 'createdAt', 'updatedAt'])
						user.id.should.be.equal(1)
						user.username.should.be.equal('maxmustermann')
						user.email.should.be.equal('mustermann@gmail.nonexistenttld')
						user.firstName.should.be.equal('Max')
						user.lastName.should.be.equal('Mustermann')
					})
			})

			it('returns a valid user resource for Philipp Loten', async () => {
				await request
					.get('/users/3')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						const user = res.body
						user.should.have.all.keys(['id', 'username', 'email', 'firstName', 'lastName', 'verified', 'createdAt', 'updatedAt'])
						user.id.should.be.equal(3)
						user.username.should.be.equal('loten')
						user.email.should.be.equal('philipp.loten@company.nonexistenttld')
						user.firstName.should.be.equal('Philipp')
						user.lastName.should.be.equal('Loten')
					})
			})

			it('fails with 403 if user requests a resource other than himself', async () => {
				await request
					.get('/users/3')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'User',
							id: 3,
							operation: 'READ'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})
		})

		describe('POST', () => {
			beforeEach(async() => {
				await setupDatabase()
			})

			it('fails with 404 if user doesn\'t exist', async () => {
				await request
					.post('/users/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ firstName: 'Neuer', lastName: 'Name', email: 'neu@mail.nonexistenttld', password: 'hurdurdur' })
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', 99)
					})
			})

			it('fails with 403 if user tries to update another user', async () => {
				await request
					.post('/users/3')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ firstName: 'New', lastName: 'name' })
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'User',
							id: 3,
							operation: 'UPDATE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails with 400 if not at least one parameter is provided', async () => {
				await request
					.post('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({})
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This request has to provide at least one of the following body values: username, firstName, lastName, email, password')
					})
			})

			it('fails if await request does not contain the current password', async () => {
				await request
					.post('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ password: 'new!' })
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'You need to provide your current password to change it.')
					})
			})

			it('fails if the current password does not match', async () => {
				await request
					.post('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ password: 'new!', currentPassword: 'wrongPassword' })
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_CREDENTIALS)
					})
			})

			it('updates a user correctly', async () => {
				await request
					.post('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ username: 'fancy-new-name', firstName: 'Neuer', lastName: 'Name', email: 'neu@mail.nonexistenttld', password: 'hurdurdur', currentPassword: '123456' })
					.expect(200)
					.expect(res => {
						const newUser = res.body
						newUser.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'email', 'verified', 'createdAt', 'updatedAt'])
						newUser.should.have.property('id').equal(1)
						newUser.should.have.property('username').equal('fancy-new-name')
						newUser.should.have.property('firstName').equal('Neuer')
						newUser.should.have.property('lastName').equal('Name')
						newUser.should.have.property('email').equal('neu@mail.nonexistenttld')
					})

				await request
					.get('/authenticate')
					.auth('fancy-new-name', 'hurdurdur')
					.expect(200)
			})

			it('successfully sets firstName and lastName to empty strings', async () => {
				await request
					.post('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ firstName: '', lastName: '' })
					.expect(200)
					.expect(res => {
						const user = res.body
						user.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'email', 'verified', 'createdAt', 'updatedAt'])
						user.should.have.property('id').equal(1)
						user.should.have.property('username').equal('maxmustermann')
						user.should.have.property('firstName').equal('')
						user.should.have.property('lastName').equal('')
						user.should.have.property('email').equal('mustermann@gmail.nonexistenttld')
					})
			})

			it('does not hash the password again if it has not changed', async () => {
				await request
					.post('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ username: 'fancy-new-name', firstName: 'Neuer', lastName: 'Name', email: 'neu@mail.nonexistenttld' })
					.expect(200)
					.expect(res => {
						const newUser = res.body
						newUser.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'email', 'verified', 'createdAt', 'updatedAt'])
						newUser.should.have.property('id').equal(1)
						newUser.should.have.property('firstName').equal('Neuer')
						newUser.should.have.property('lastName').equal('Name')
						newUser.should.have.property('email').equal('neu@mail.nonexistenttld')
					})

				await request
					.get('/authenticate')
					.auth('fancy-new-name', '123456')
					.expect(200)
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails with 403 if user tries to delete another user', async () => {
				await request
					.delete('/users/5')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'User',
							id: 5,
							operation: 'DELETE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails with 404 if user doesn\'t exist', async () => {
				await request
					.delete('/users/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', 99)
					})
			})

			it('deletes an existing user', async () => {
				await request
					.delete('/users/3')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request
					.get('/users/3')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('deletes all group memberships of this user', async () => {
				await request
					.delete('/users/2')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/groups/1/members')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(res => {
						const members = res.body
						members.should.be.an('array').with.lengthOf(1)
						members[0].should.have.property('id').equal(1)
					})
			})

			it('sets the foreign key on all associated comments to null', async () => {
				await request
					.delete('/users/2')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/comments/3')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const comment = res.body
						comment.should.have.property('userId').equal(null)
					})
			})

			it('sets the foreign key on all associated participants to null', async () => {
				await request
					.delete('/users/2')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/participants/2')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const participant = res.body
						participant.should.have.property('userId').equal(null)
					})
			})
		})

		describe('/groups', () => {
			before(async () => {
				await setupDatabase()
			})

			describe('GET', () => {
				it('fails if user tries to access another users groups', async () => {
					await request
						.get('/users/1/groups')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'GroupCollection',
								id: null,
								operation: 'READ'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
				})

				it('sends a correct group collection', async () => {
					await request
						.get('/users/1/groups')
						.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
						.expect(200)
						.expect(res => {
							const groups = res.body
							groups.should.be.an('array').of.length(1)

							const group = groups[0]

							group.should.have.all.keys(['id', 'name', 'lunchTime', 'voteEndingTime', 'utcOffset', 'pointsPerDay', 'maxPointsPerVote', 'minPointsPerVote', 'lunchbreaks', 'members', 'places', 'invitations'])
							group.should.have.property('members').which.is.an('array').with.lengthOf(2)
							group.should.have.property('lunchbreaks').which.is.an('array')
							group.should.have.property('places').which.is.an('array')
							group.should.have.property('invitations').which.is.an('array')

							const member = group.members[0]
							member.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'config'])
						})
				})
			})
		})

		describe('/invitations', () => {
			describe('GET', () => {
				it('fails if the user tries to access another users invitations', async () => {
					await request
						.get('/users/1/invitations')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.expect(403)
						.expect(res => {
							const errorItem = {
								resource: 'InvitationCollection',
								id: null,
								operation: 'READ'
							}
							errorHelper.checkAuthorizationError(res.body, errorItem)
						})
				})

				it('sends a correct collection of invitations', async () => {
					await request
						.get('/users/3/invitations')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(200)
						.expect(res => {
							const invitations = res.body
							const expected = {
								group: {
									id: 1,
									name: 'Group_1'
								},
								from: {
									id: 1,
									username: 'maxmustermann',
									firstName: 'Max',
									lastName: 'Mustermann'
								},
								to: {
									id: 3,
									username: 'loten',
									firstName: 'Philipp',
									lastName: 'Loten'
								}
							}

							invitations.should.be.an('array')
							const firstInvitation = invitations[0]
							firstInvitation.should.be.eql(expected)
						})
				})
			})

			describe('DELETE', () => {

				beforeEach(async () => {
					await setupDatabase()
				})

				it('fails if the user tries to delete another users invitations', async () => {
					await request
						.delete('/users/3/invitations')
						.query({ groupId: 1, accept: false })
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.expect(403)
						.expect(res => {
							const errorItem = {
								resource: 'Invitation',
								id: null,
								operation: 'DELETE'
							}
							errorHelper.checkAuthorizationError(res.body, errorItem)
						})
				})

				it('requires query values groupId, accept', async () => {
					await request
						.delete('/users/3/invitations')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(400)
						.expect(res => {
							errorHelper.checkRequiredQueryValues(res.body, ['groupId', 'accept'], 'all')
						})
				})

				it('sends NotFoundError', async () => {
					await request
						.delete('/users/3/invitations')
						.query({ groupId: 299, accept: true })
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Invitation', null)
						})
				})

				it('successfully accepts an invitation', async () => {
					await request
						.delete('/users/3/invitations')
						.query({ groupId: 1, accept: true })
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(204)

					await request
						.get('/users/3/groups')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(200)
						.expect(res => {
							const groups = res.body
							for (const group of groups) {
								if (group.id === 1) return
							}
							throw new Error('User 3 did not join group 1')
						})
				})

				it('selects a random color for the new group member', async () => {
					await request
						.delete('/users/3/invitations')
						.query({ groupId: 1, accept: true })
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(204)

					await request
						.get('/groups/1')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(200)
						.expect(res => {
							const group = res.body

							for (const member of group.members) {
								if (member.id === 3) {
									const colors = ['#ffa768', '#e0dbff', '#f5e97d', '#ffa1b7', '#948bf0', '#a8f08d']
									colors.should.include(member.config.color)
								}
							}
						})
				})

				it('successfully rejects an invitation', async () => {
					await request
						.delete('/users/3/invitations')
						.query({ groupId: 1, accept: false })
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(204)

					await request
						.get('/users/3/invitations')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(200)
						.expect(res => {
							const invitations = res.body
							invitations.should.be.an('array').with.length(0)
						})

					await request
						.get('/users/3/groups')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(200)
						.expect(res => {
							const groups = res.body
							for (const group of groups) {
								if (group.id === 1) throw new Error('User 3 did join group 1')
							}
						})
				})

				it('does not delete the associated group', async () => {
					await request
						.delete('/users/3/invitations')
						.query({ groupId: 1, accept: true })
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(204)

					await request
						.get('/groups/1')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(200)
				})

				it('does not delete the associated users', async () => {
					await request
						.delete('/users/3/invitations')
						.query({ groupId: 1, accept: true })
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(204)

					await request
						.get('/users/1')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(403)

					await request
						.get('/users/3')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(200)
				})
			})
		})
	})
})
