const setupDatabase = require('../utils/scripts/setup-database')
const testData = require('../utils/scripts/test-data')
const errorHelper = require('../utils/errors')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')

describe('Group', () => {
	describe('/groups', () => {
		describe('POST', () => {
			const newGroup = {
				name: 'My cool group',
				lunchTime: '12:30:00',
				voteEndingTime: '12:00:00',
				utcOffset: 60,
				pointsPerDay: 20,
				maxPointsPerVote: 10,
				minPointsPerVote: 5
			}

			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if required values are missing', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const MESSAGE = 'This request has to provide all of the following body values: name'
						errorHelper.checkRequestError(res.body, MESSAGE)
					})
			})

			it('fails if pointsPerDay, maxPointsPerVote or minPointsPerVote is not a number between 1 and 1000')

			it('sucessfully creates a group', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(newGroup)
					.expect(201)
					.expect(res => {
						const group = res.body
						group.should.have.all.keys(testData.getGroupKeys())
						Object.keys(newGroup).forEach(key => group[key].should.be.eql(newGroup[key]))
						group.places.should.be.an('array').with.lengthOf(0)
						group.members.should.be.an('array').with.lengthOf(1)
					})
			})

			it('adds the creating user as group admin', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(newGroup)
					.expect(201)
					.then(res => {
						const member = res.body.members[0]
						member.should.have.all.keys(testData.getGroupMemberKeys())
						member.should.have.property('username').equal('maxmustermann')
						member.should.have.property('config').which.has.property('isAdmin').equal(true)
						member.should.have.property('config').which.has.property('color').equal('#80d8ff')
					})
			})
		})
	})

	describe('/groups/:groupId', () => {
		it('sends a 404 if the group does not exist', async () => {
			await request
				.get('/groups/99')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.expect(404)
				.expect(res => {
					errorHelper.checkNotFoundError(res.body, 'Group', 99)
				})
		})

		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('sends a valid group-resource', async () => {
				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => res.body.should.be.equalInAnyOrder(testData.getGroup(1)))
			})

			it('sends 403 if user isn\'t a group member', async () => {
				await request
					.get('/groups/2')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Group',
							id: 2,
							operation: 'READ'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('sends 404 if group doesn\'t exist', async () => {
				await request
					.get('/groups/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Group', 99)
					})
			})
		})

		describe('PUT', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails with 404 if group doesn\'t exist', async () => {
				await request
					.put('/groups/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ name: 'New name' })
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Group', 99)
					})
			})

			it('fails with 403 if the user is no group admin', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send({ name: 'New name' })
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Group',
							id: 1,
							operation: 'UPDATE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('requires at least one parameter', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send()
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body)
					})
			})

			it('fails if pointsPerDay less than maxPointsPerVote', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						pointsPerDay: 69,
						maxPointsPerVote: 70
					})
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'pointsPerDay',
							value: 69,
							message: 'pointsPerDay has to be equal or greater than maxPointsPerVote.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if voteEndingTime is greater than lunchTime', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						voteEndingTime: '13:00:00',
						lunchTime: '12:30:00'
					})
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'timeValidator',
							value: null,
							message: 'voteEndingTime has to be less than lunchTime.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if minPointsPerVote is greater than maxPointsPerVote', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						minPointsPerVote: 50,
						maxPointsPerVote: 40
					})
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'minPointsPerVote',
							value: 50,
							message: 'minPointsPerVote has to be less than or equal to maxPointsPerVote.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if maxPointsPerVote is less than minPointsPerVote', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						minPointsPerVote: 30,
						maxPointsPerVote: 29
					})
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'maxPointsPerVote',
							value: 29,
							message: 'maxPointsPerVote has to be greater than or equal to minPointsPerVote.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if maxPointsPerVote is greater than pointsPerDay', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						pointsPerDay: 30,
						maxPointsPerVote: 31
					})
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'maxPointsPerVote',
							value: 31,
							message: 'maxPointsPerVote has to be less than or equal to pointsPerDay.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if minPointsPerVote is greater than pointsPerDay', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						minPointsPerVote: 101,
						pointsPerDay: 100
					})
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'minPointsPerVote',
							value: 101,
							message: 'minPointsPerVote has to be less than or equal to pointsPerDay.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if utcOffset is greater than 720', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ utcOffset: 721 })
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'utcOffset',
							value: 721,
							message: 'utcOffset cannot be greater than 720'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if utcOffset is less than -720', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ utcOffset: -721 })
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'utcOffset',
							value: -721,
							message: 'utcOffset cannot be less than -720'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if utcOffset is not a multiple of 60', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ utcOffset: 61 })
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'utcOffset',
							value: 61,
							message: 'This is not a valid UTC offset.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('updates a group successfully', async () => {
				const data = {
					name: 'New name',
					lunchTime: '14:00:00',
					voteEndingTime: '13:30:00',
					utcOffset: -120,
					pointsPerDay: 300,
					maxPointsPerVote: 100,
					minPointsPerVote: 50
				}

				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(data)
					.expect(200)
					.expect(res => {
						const group = res.body
						group.should.have.all.keys(testData.getGroupKeys())
						Object.keys(data).forEach(key => group[key].should.be.eql(data[key]))
					})
			})

			it('converts string numbers into integers', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						name: 'New name',
						lunchTime: '14:00:00',
						voteEndingTime: '13:30:00',
						utcOffset: '120',
						pointsPerDay: '300',
						maxPointsPerVote: '100',
						minPointsPerVote: '50'
					})
					.expect(200)
					.expect(res => {
						const group = res.body
						group.utcOffset.should.be.eql(120)
						group.pointsPerDay.should.be.eql(300)
						group.maxPointsPerVote.should.be.eql(100)
						group.minPointsPerVote.should.be.eql(50)
					})
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('requires admin rights', async () => {
				await request
					.delete('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Group',
							id: 1,
							operation: 'DELETE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('deletes a group successfully', async () => {
				await request
					.delete('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('deletes all participations associated to this group', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-12-31' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => {
						res.body.should.be.an('array').length.which.is.above(0)
					})

				await request
					.delete('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-12-31' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => {
						res.body.should.be.an('array').with.lengthOf(0)
					})
			})

			it('deletes all lunchbreaks associated to this group')

			it('deletes all members of this group', async () => {
				const members = await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => res.body.members)

				await request
					.delete('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				for (const member of members) {
					await request
						.get('/users/me/groups')
						.set(await TokenHelper.getAuthorizationHeader(member.username))
						.then(res => {
							if (res.body.find(group => group.id === 1))
								throw new Error('User is still a member of group 1')
						})
				}
			})

			it('deletes all associated invitatons', async () => {
				await request
					.delete('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me/invitations')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(res => {
						const invitations = res.body
						invitations.should.be.an('array').with.lengthOf(0)
					})
			})
		})
	})

	describe('/users/me/groups', () => {
		before(async () => {
			await setupDatabase()
		})

		describe('GET', () => {
			it('sends a correct group collection', async () => {
				await request
					.get('/users/me/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getGroupsOfUser(1))
					})

				await request
					.get('/users/me/groups')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getGroupsOfUser(2))
					})

				await request
					.get('/users/me/groups')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getGroupsOfUser(3))
					})
			})
		})
	})
})
