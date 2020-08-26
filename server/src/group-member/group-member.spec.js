const Boom = require('@hapi/boom')
const testData = require('../knex/seeds')
const testServer = require('../../test/utils/test-server')
const request = require('supertest')('http://localhost:5001')
const TokenHelper = require('../../test/utils/token-helper')
const { expect } = require('chai')

describe('Group Member', () => {
	describe('/groups/:groupId/members/:username', () => {
		it('returns a 404 if user is no group member', async () => {
			await request
				.put('/groups/1/members/unknown-username')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send({
					isAdmin: true,
					color: '#eeeeee'
				})
				.expect(404)

			await request
				.delete('/groups/1/members/unknown-username')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.expect(404)
		})

		describe('PUT', () => {
			it('should return a member resource', async () => {
				await request
					.put('/groups/1/members/maxmustermann')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						isAdmin: true,
						color: '#eeeeee'
					})
					.expect(200)
					.expect(res => res.body.should.have.all.keys(testData.getGroupMemberKeys()))
			})

			it('allows an user to change his color', async () => {
				await request
					.put('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send({ color: '#eeeeee', isAdmin: false })
					.expect(200)
					.expect(res => {
						const member = res.body
						member.config.color.should.be.eql('#eeeeee')
					})
			})

			it('fails if color is invalid', async () => {
				const invalid = ['ee2345', '#1234567', '#ae123g']

				for (const color of invalid) {
					await request
						.put('/groups/1/members/johndoe1')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.send({ color, isAdmin: false })
						.expect(400)
						.expect({
							statusCode: 400,
							error: 'Bad Request',
							message: `"color" with value "${color}" fails to match the required pattern: /^#[a-f0-9]{6}$/`,
							validation: { source: 'payload', keys: ['color'] }
						})
				}
			})

			it('allows an admin to change another member', async () => {
				await request
					.put('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
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
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ color: '#24c4ee', isAdmin: true })
					.expect(200)
					.expect(res => {
						const member = res.body
						member.config.isAdmin.should.be.eql(true)
					})

				await request
					.put('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ color: '#24c4ee', isAdmin: false })
					.expect(200)
					.expect(res => {
						const member = res.body
						member.config.isAdmin.should.be.equal(false)
					})
			})

			it('fails if a non admin member tries to change another member', async () => {
				await request
					.put('/groups/1/members/maxmustermann')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('fails if a non admin tries to get admin rights', async () => {
				await request
					.put('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send({ color: '#eeeeee', isAdmin: true })
					.expect(403)
					.expect(Boom.forbidden('You cannot grant yourself admin rights').output.payload)
			})

			it('fails if the user is the groups last admin', async () => {
				await request
					.put('/groups/1/members/maxmustermann')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ color: '#eeeeee', isAdmin: false })
					.expect(403)
					.expect(Boom.forbidden('You are the last admin and cannot revoke your rights').output.payload)
			})
		})

		describe('DELETE', () => {
			it('requires group admin rights to remove other members', async () => {
				await request
					.delete('/groups/1/members/maxmustermann')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('lets the admins remove other group members', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)
			})

			it('allows a user to leave a group', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)
			})

			it('fails if the user is the groups last admin', async () => {
				await request
					.delete('/groups/1/members/maxmustermann')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(403)
					.expect(
						Boom.forbidden('You are the last administrator of this group and cannot leave the group').output.payload
					)
			})

			it('does not delete the associated group', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('does not delete the associated user', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
			})

			it('does not revoke the invitations of this user', async () => {
				await request
					.post('/groups/1/invitations/alice')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				// Make john admin so max can leave
				await request
					.put('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ color: '#123456', isAdmin: true })
					.expect(200)

				await request
					.delete('/groups/1/members/maxmustermann')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me/invitations')
					.set(await TokenHelper.getAuthorizationHeader('alice'))
					.expect(200)
					.expect(res => {
						const invitation = res.body.find(i => i.group.id === 1)
						if (!invitation) {
							throw new Error('Invitation not found!')
						}
					})
			})

			it('does set the author of all comments of this user to null', async () => {
				await request
					.delete('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						expect(res.body.comments.find(c => c.id === 3).author).to.be.null
					})
			})

			it('does not fuck up lunchbreaks where the ex-member is responseless', async () => {
				await testServer.start('11:24:59', '25.06.2018')
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.delete('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})
		})
	})
})
