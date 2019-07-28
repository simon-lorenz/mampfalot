const setupDatabase = require('../utils/scripts/setup-database')
const testData = require('../utils/scripts/test-data')
const errorHelper = require('../utils/errors')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')

describe('Invitation', () => {

	describe('/groups/:groupId/invitations', () => {

		describe('GET', () => {

			before(async () => {
				await setupDatabase()
			})

			it('fails if the user is no group member', async() => {
				await request
					.get('/groups/1/invitations')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(res => {
						const errorItem = {
							resource: 'Group',
							id: 1,
							operation: 'READ'
						}
						errorHelper.checkAuthorizationError(res.body, errorItem)
					})
			})

			it('returns a collection of invitations', async () => {
				await request
					.get('/groups/1/invitations')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getInvitations(1))
					})
			})
		})

	})

	describe('/groups/:groupId/invitations/:username', () => {

		describe('POST', () => {

			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if the user is no group member', async () => {
				await request
					.post('/groups/1/invitations/alice')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(res => {
						const errorItem = {
							resource: 'Invitation',
							id: null,
							operation: 'CREATE'
						}
						errorHelper.checkAuthorizationError(res.body, errorItem)
					})
			})

			it('fails if the invited user is already a group member', async () => {
				await request
					.post('/groups/1/invitations/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const error = res.body
						const item = {
							field: 'to',
							value: 2,
							message: 'This user is already a member of this group.'
						}
						errorHelper.checkValidationError(error, item)
					})
			})

			it('fails if invited user is not found', async () => {
				await request
					.post('/groups/1/invitations/unknown-user')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('fails if the user is already invited', async () => {
				await request
					.post('/groups/1/invitations/loten')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(res => {
						const errorItem = {
							field: 'username',
							value: 'loten',
							message: 'This user is already invited.'
						}
						errorHelper.checkValidationError(res.body, errorItem)
						// TODO: Return error only once
						// res.body.errors.should.be.an('array').with.lengthOf(1)
					})
			})

			it('members cannot invite', async () => {
				await request
					.post('/groups/1/invitations/alice')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(res => {
						const expected = {
							resource: 'Invitation',
							operation: 'CREATE'
						}
						errorHelper.checkAuthorizationError(res.body, expected)
					})
			})

			it('creates a new invitation successfully', async () => {
				await request
					.post('/groups/1/invitations/björn_tietgen')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)
					.expect(res => {
						const expected = {
							group: testData.getGroup(1),
							from: testData.getUser(1),
							to: testData.getUser(4)
						}

						res.body.should.be.equalInAnyOrder(expected)
					})
			})

		})

		describe('DELETE', () => {

			beforeEach(async () => {
				await setupDatabase()
			})

			it('sends NotFoundError', async () => {
				await request
					.delete('/groups/1/invitations/alice')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Invitation', null)
					})
			})

			it('admins can delete invitations', async () => {
				await request
					.delete('/groups/1/invitations/loten')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/invitations')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						if (res.body.find(invitation => invitation.to.username === 'loten'))
							throw new Error('The invitation was not deleted!')
					})
			})

			it('members cannot delete invitations', async () => {
				await request
					.delete('/groups/1/invitations/loten')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
			})

			it('does not delete the associated users', async () => {
				await request
					.delete('/groups/1/invitations/loten')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)

				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
			})

			it('does not delete the associated group', async () => {
				await request
					.delete('/groups/1/invitations/loten')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

		})

	})

	describe('/users/me/invitations', () => {

		describe('GET', () => {

			before(async () => await setupDatabase())

			it('sends a correct collection of invitations', async () => {
				await request
					.get('/users/me/invitations')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getInvitationsOfUser(3))
					})
			})

		})

	})

	describe('/users/me/invitations/:groupId', () => {

		describe('DELETE', () => {

			beforeEach(async () => {
				await setupDatabase()
			})

			it('requires query value accept', async () => {
				await request
					.delete('/users/me/invitations/1')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(400)
					.expect(res => {
						errorHelper.checkRequiredQueryValues(res.body, ['accept'], 'all')
					})
			})

			it('sends NotFoundError', async () => {
				await request
					.delete('/users/me/invitations/299')
					.query({ accept: true })
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Invitation', null)
					})
			})

			it('successfully accepts an invitation', async () => {
				await request
					.delete('/users/me/invitations/1')
					.query({ accept: true })
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request
					.get('/users/me/invitations')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.then(res => {
						if (res.body.find(invitation => invitation.groupId === 1))
							throw new Error('The invitation was not deleted!')
					})

				await request
					.get('/users/me/groups')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						if (res.body.find(group => group.id === 1) === undefined)
							throw new Error('User 3 did not join group 1')
					})
			})

			it('selects a random color for the new group member', async () => {
				await request
					.delete('/users/me/invitations/1')
					.query({ accept: true })
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						const newMember = res.body.members.find(member => member.username === 'loten')
						const colors = ['#ffa768', '#e0dbff', '#f5e97d', '#ffa1b7', '#948bf0', '#a8f08d']
						colors.should.include(newMember.config.color)
					})
			})

			it('successfully rejects an invitation', async () => {
				await request
					.delete('/users/me/invitations/1')
					.query({ accept: false })
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request
					.get('/users/me/invitations')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.then(res => {
						if (res.body.find(invitation => invitation.groupId === 1))
							throw new Error('The invitation was not deleted!')
					})

				await request
					.get('/users/me/groups')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						if (res.body.find(group => group.id === 1))
							throw new Error('User 3 did join group 1')
					})
			})

			it('does not delete the associated group', async () => {
				await request
					.delete('/users/me/invitations/1')
					.query({ accept: true })
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
			})

			it('does not delete the associated users', async () => {
				await request
					.delete('/users/me/invitations/1')
					.query({ accept: true })
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
			})

		})

	})

})
