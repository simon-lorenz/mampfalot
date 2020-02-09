const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const { AuthenticationErrorTypes } = require('../utils/errors')
const util = require('../utils/util')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')
const testServer = require('../utils/test-server')
const { expect } = require('chai')

describe('User', () => {
	describe('/users', () => {
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
				newUser.password =
					'asdfghjklqweasdfghjklqweasdfghjklqweasdfghjklqweas' +
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
				}
			})
		})
	})

	describe('/users/:username/forgot-password', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('sends 404 if username is unknown', async () => {
				await request
					.get('/users/non-existent-user/forgot-password')
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', 'non-existent-user')
					})
			})

			it('sends 204 if username is known', async () => {
				await request.get('/users/maxmustermann/forgot-password').expect(204)
			})
		})

		describe('POST', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('resets a password successfully', async () => {
				testServer.start(5001, '14:33:00', '27.01.2020')

				await request
					.post('/users/please-change-my-password/forgot-password')
					.send({
						token: 'cc915e69976263e3464402d24c65df4dbd750b54ca0b96d69f',
						newPassword: 'this-is-my-new-password'
					})
					.expect(204)

				await request
					.get('/authenticate')
					.auth('please-change-my-password', 'this-is-my-new-password')
					.expect(200)
			})

			it('fails if the password is too short', async () => {
				testServer.start(5001, '14:33:00', '27.01.2020')

				await request
					.post('/users/please-change-my-password/forgot-password')
					.send({
						token: 'cc915e69976263e3464402d24c65df4dbd750b54ca0b96d69f',
						newPassword: '123'
					})
					.expect(400)
			})

			it('fails if the body does not contain a resetToken', async () => {
				await request
					.post('/users/maxmustermann/forgot-password')
					.send({ newPassword: '123456789' })
					.expect(res => {
						errorHelper.checkRequestError(
							res.body,
							'This request has to provide all of the following body values: token, newPassword'
						)
					})
			})

			it('fails if the body does not contain a new password', async () => {
				await request
					.post('/users/maxmustermann/forgot-password')
					.send({ token: '123' })
					.expect(res => {
						errorHelper.checkRequestError(
							res.body,
							'This request has to provide all of the following body values: token, newPassword'
						)
					})
			})

			it('fails with 404 on unknown user', async () => {
				await request
					.post('/users/non-existent-user/forgot-password')
					.send({ token: 'my-invalid-token', newPassword: 'supersafe123456' })
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', 'non-existent-user')
					})
			})

			it('fails on invalid credentials', async () => {
				await request.get('/users/maxmustermann/forgot-password').expect(204)

				await request
					.post('/users/maxmustermann/forgot-password')
					.send({ token: '123', newPassword: '123456789' })
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_CREDENTIALS)
					})
			})
		})
	})

	describe('/users/:username/verify', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('sends 404 if username is unknown', async () => {
				await request
					.get('/users/non-existent-user/verify')
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', 'non-existent-user')
					})
			})

			it('fails if user is already verified', async () => {
				await request
					.get('/users/maxmustermann/verify')
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'This user is already verified.')
					})
			})

			it('sends 204 if user is unverified', async () => {
				await request.get('/users/to-be-verified/verify').expect(204)
			})
		})

		describe('POST', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if the body does not contain a token', async () => {
				await request.post('/users/maxmustermann/verify').expect(res => {
					errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: token')
				})
			})

			it('fails with invalid credentials', async () => {
				await request
					.post('/users/to-be-verified/verify')
					.send({ token: '123456' })
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_CREDENTIALS)
					})
			})

			it('fails with 404 on unknown user', async () => {
				await request
					.post('/users/non-existent-user/verify')
					.send({ token: 'my-invalid-token' })
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'User', 'non-existent-user')
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
					.post('/users/to-be-verified/verify')
					.send({ token: 'valid-token' })
					.expect(204)

				await request
					.get('/authenticate')
					.auth('to-be-verified', 'verifyme')
					.expect(200)
			})
		})
	})

	describe('/users/:email/forgot-username', () => {
		describe('GET', () => {
			it('sends 204 on non existing email', async () => {
				await request.get('/users/non-existing-address@provider.nonexistenttld/forgot-username').expect(204)
			})

			it('sends 204 on existing email', async () => {
				await request.get('/users/philipp.loten@company.nonexistenttld/forgot-username').expect(204)
			})
		})
	})

	describe('/users/me', () => {
		describe('GET', () => {
			it('returns a valid user resource for Max Mustermann', async () => {
				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.should.be.deep.eql(testData.getUserWithEmail(1))
					})
			})

			it('returns a valid user resource for Philipp Loten', async () => {
				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						res.body.should.be.deep.eql(testData.getUserWithEmail(3))
					})
			})
		})

		describe('PUT', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails with 400 if not all parameters are provided', async () => {
				await request
					.put('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(
							res.body,
							'This request has to provide all of the following body values: username, firstName, lastName, email'
						)
					})
			})

			it('fails if the request tries to change the password but does not contain the current password', async () => {
				const payload = testData.getUserWithEmail(1)
				payload.password = 'my-new-password-123'
				await request
					.put('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(payload)
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body, 'You need to provide your current password to change it.')
					})
			})

			it('fails if the current password does not match', async () => {
				const payload = testData.getUserWithEmail(1)
				payload.password = 'my-new-password-123'
				payload.currentPassword = 'wrongPassword'
				await request
					.put('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(payload)
					.expect(401)
					.expect(res => {
						errorHelper.checkAuthenticationError(res.body, AuthenticationErrorTypes.INVALID_CREDENTIALS)
					})
			})

			it('updates a user correctly', async () => {
				await request
					.put('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						username: 'fancy-new-name',
						firstName: 'Neuer',
						lastName: 'Name',
						email: 'neu@mail.nonexistenttld',
						password: 'hurdurdur',
						currentPassword: '123456'
					})
					.expect(200)
					.expect(res => {
						res.body.username.should.be.equal('fancy-new-name')
						res.body.firstName.should.be.equal('Neuer')
						res.body.lastName.should.be.equal('Name')
						res.body.email.should.be.equal('neu@mail.nonexistenttld')
					})

				await request
					.get('/authenticate')
					.auth('fancy-new-name', 'hurdurdur')
					.expect(200)
			})

			it('requires e-mail verification before change')

			it('successfully sets firstName and lastName to null', async () => {
				const payload = testData.getUserWithEmail(1)
				payload.firstName = null
				payload.lastName = null

				await request
					.put('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(payload)
					.expect(200)
					.expect(res => {
						expect(res.body.firstName).to.be.null
						expect(res.body.lastName).to.be.null
					})
			})

			it('converts empty string in first and lastName to null', async () => {
				const payload = testData.getUserWithEmail(1)
				payload.firstName = ''
				payload.lastName = ''

				await request
					.put('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(payload)
					.expect(200)
					.expect(res => {
						expect(res.body.firstName).to.be.null
						expect(res.body.lastName).to.be.null
					})
			})

			it('does not hash the password again if it has not changed', async () => {
				await request
					.put('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						username: 'fancy-new-name',
						firstName: 'Neuer',
						lastName: 'Name',
						email: 'neu@mail.nonexistenttld'
					})
					.expect(200)

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

			it('deletes an existing user', async () => {
				await request
					.delete('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request.get('/auth').auth('loten', testData.getPassword('loten'))
			})

			it('deletes all group memberships of this user', async () => {
				await request
					.delete('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(res => {
						res.body.members.should.be.deep.eql([testData.getGroupMember(1)])
					})
			})

			it('deletes invitations to this user', async () => {
				await request
					.post('/groups/1/invitations/alice')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await request
					.delete('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('alice'))
					.expect(204)

				await request
					.get('/groups/1/invitations')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const invitation = res.body.find(i => i.to.username === 'alice')
						if (invitation) {
							throw new Error('Invitation was not deleted')
						}
					})
			})

			it('sets the username on associated comments to null', async () => {
				await request
					.delete('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const comment = res.body.comments.find(c => c.id === 3)
						comment.should.have.property('author').eql(null)
					})
			})

			it('sets the member property on associated participants to null', async () => {
				await request
					.delete('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const participants = res.body.participants
						participants.should.deep.include({ member: null, votes: [] })
					})
			})
		})
	})
})
