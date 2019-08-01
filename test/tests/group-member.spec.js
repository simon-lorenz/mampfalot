const setupDatabase = require('../utils/scripts/setup-database')
const testData = require('../utils/scripts/test-data')
const errorHelper = require('../utils/errors')
const request = require('supertest')('http://localhost:5001/api')
const SessionHelper = require('../utils/session-helper')

describe('Group Member', () => {
	describe('/groups/:groupId/members/:username', () => {
		it('returns a 404 if user is no group member', async () => {
			await request
				.put('/groups/1/members/unknown-username')
				.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
				.expect(404)
				.expect(res => {
					errorHelper.checkNotFoundError(res.body, 'User', 'unknown-username')
				})

			await request
				.delete('/groups/1/members/unknown-username')
				.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
				.expect(404)
				.expect(res => {
					errorHelper.checkNotFoundError(res.body, 'User', 'unknown-username')
				})
		})

		describe('PUT', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('should return a member resource', async () => {
				await request
					.put('/groups/1/members/maxmustermann')
					.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
					.send({ color: '#eeeeee' })
					.expect(200)
					.expect(res => res.body.should.have.all.keys(testData.getGroupMemberKeys()))
			})

			it('allows an user to change his color', async () => {
				await request
					.put('/groups/1/members/johndoe1')
					.set('cookie', await SessionHelper.getSessionCookie('johndoe1'))
					.send({ color: '#eeeeee' })
					.expect(200)
					.expect(res => {
						const member = res.body
						member.config.color.should.be.eql('#eeeeee')
					})
			})

			it('allows an admin to change another member', async () => {
				await request
					.put('/groups/1/members/johndoe1')
					.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
					.send({ color: '#fafafa', isAdmin: true })
					.expect(200)
					.expect(res => {
						const member = res.body
						member.config.color.should.be.eql('#fafafa')
						member.config.isAdmin.should.be.eql(true)
					})
			})

			it('successfully grants and revokes a users admin rights', async () => {
				await request
					.put('/groups/1/members/johndoe1')
					.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
					.send({ isAdmin: true })
					.expect(200)
					.expect(res => {
						const member = res.body
						member.config.isAdmin.should.be.eql(true)
					})

				await request
					.put('/groups/1/members/johndoe1')
					.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
					.send({ isAdmin: false })
					.expect(200)
					.expect(res => {
						const member = res.body
						member.config.isAdmin.should.be.equal(false)
					})
			})

			it('fails if a non admin member tries to change another member', async () => {
				await request
					.put(('/groups/1/members/maxmustermann'))
					.set('cookie', await SessionHelper.getSessionCookie('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'GroupMember',
							id: 'maxmustermann',
							operation: 'UPDATE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails if a non admin tries to get admin rights', async () => {
				const TRUTHY = [true, 'true', 1, '1']

				for (const val of TRUTHY) {
					await request
						.put('/groups/1/members/johndoe1')
						.set('cookie', await SessionHelper.getSessionCookie('johndoe1'))
						.send({ isAdmin: val })
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'GroupMember',
								id: 'johndoe1',
								operation: 'UPDATE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
				}
			})

			it('fails if the user is the groups last admin', async () => {
				await request
					.put('/groups/1/members/maxmustermann')
					.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
					.send({ isAdmin: false })
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'GroupMember',
							id: 'maxmustermann',
							operation: 'UPDATE',
							message: 'This user is the last admin of this group and cannot revoke his rights.'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('requires group admin rights to remove other members', async () => {
				await request
					.delete('/groups/1/members/maxmustermann')
					.set('cookie', await SessionHelper.getSessionCookie('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'GroupMember',
							id: 'maxmustermann',
							operation: 'DELETE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('lets the admins remove other group members', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
					.expect(204)
			})

			it('allows a user to leave a group', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set('cookie', await SessionHelper.getSessionCookie('johndoe1'))
					.expect(204)
			})

			it('fails if the user is the groups last admin', async () => {
				await request
					.delete('/groups/1/members/maxmustermann')
					.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'GroupMember',
							id: 'maxmustermann',
							operation: 'DELETE',
							message: 'You are the last administrator of this group and cannot leave the group.'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('does not delete the associated group', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set('cookie', await SessionHelper.getSessionCookie('johndoe1'))
					.expect(204)

				await request
					.get('/groups/1')
					.set('cookie', await SessionHelper.getSessionCookie('maxmustermann'))
					.expect(200)
			})

			it('does not delete the associated user', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set('cookie', await SessionHelper.getSessionCookie('johndoe1'))
					.expect(204)

				await request
					.get('/users/me')
					.set('cookie', await SessionHelper.getSessionCookie('johndoe1'))
					.expect(200)
			})
		})
	})
})
