'use strict'

const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/groups', () => {
		describe('POST', () => {
			const newGroup = {
				name: 'My cool group',
				defaultLunchTime: '12:30:00',
				defaultVoteEndingTime: '12:00:00',
				utcOffset: 60,
				pointsPerDay: 20,
				maxPointsPerVote: 10,
				minPointsPerVote: 5
			}

			beforeEach(async () => {
				await setup.resetData()
			})

			it('fails if required values are missing', async () => {
				await request
					.post('/groups')
					.set({ Authorization: bearerToken[1] })
					.expect(400)
					.expect(res => {
						const MESSAGE = 'This request has to provide all of the following body values: name'
						errorHelper.checkRequestError(res.body, MESSAGE)
					})
			})

			it('sucessfully creates a group', (done) => {
				request
					.post('/groups')
					.set({ Authorization: bearerToken[1] })
					.send(newGroup)
					.expect(200)
					.expect(res => {
						const group = res.body
						group.should.have.all.keys(['id', 'name', 'defaultLunchTime', 'defaultVoteEndingTime', 'utcOffset', 'pointsPerDay', 'maxPointsPerVote', 'minPointsPerVote', 'lunchbreaks', 'members', 'places', 'invitations'])
						group.should.have.property('id')
						group.should.have.property('name').equal(newGroup.name)
						group.should.have.property('defaultLunchTime').equal(newGroup.defaultLunchTime)
						group.should.have.property('defaultVoteEndingTime').equal(newGroup.defaultVoteEndingTime)
						group.should.have.property('utcOffset').equal(newGroup.utcOffset)
						group.should.have.property('pointsPerDay').equal(newGroup.pointsPerDay)
						group.should.have.property('maxPointsPerVote').equal(newGroup.maxPointsPerVote)
						group.should.have.property('minPointsPerVote').equal(newGroup.minPointsPerVote)
						group.should.have.property('members').which.is.an('array')
						group.should.have.property('lunchbreaks').which.is.an('array')
						group.should.have.property('places').which.is.an('array')
						group.should.have.property('invitations').which.is.an('array')

					})
					.end(done)
			})

			it('adds the creating user as group admin', async () => {
				await request
					.post('/groups')
					.set({ Authorization: bearerToken[1] })
					.send(newGroup)
					.then(res => {
						const group = res.body
						const members = group.members
						const member = members[0]
						member.should.have.property('id').equal(1)
						member.should.have.property('config').which.has.property('isAdmin').equal(true)
					})
			})
		})

		describe('/:groupId', () => {
			it('sends a 404 if the group does not exist', (done) => {
				request
					.get('/groups/99')
					.set({ Authorization: bearerToken[1] })
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Group', 99)
					})
					.end(done)
			})

			describe('GET', () => {
				before(async () => {
					await setup.resetData()
				})

				it('sends a valid group-resource', (done) => {
					request
						.get('/groups/1')
						.set({
							Authorization: bearerToken[1]
						})
						.expect(200, (err, res) => {
							const group = res.body

							group.should.be.an('object')
							group.should.have.property('name').equal('Group_1')
							group.should.have.property('defaultLunchTime').equal('12:30:00')
							group.should.have.property('defaultVoteEndingTime').equal('12:25:00')
							group.should.have.property('pointsPerDay').equal(100)
							group.should.have.property('maxPointsPerVote').equal(70)
							group.should.have.property('minPointsPerVote').equal(30)
							group.should.have.property('members').which.is.an('array').and.has.length(2)
							group.should.have.property('lunchbreaks').which.is.an('array').and.has.length(2)
							group.should.have.property('places').which.is.an('array').and.has.length(4)
							group.should.have.property('invitations').which.is.an('array').with.length(1)

							const member = group.members[0]
							member.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'config'])

							done()
						})
				})

				it('sends 403 if user isn\'t a group member', (done) => {
					request
						.get('/groups/2')
						.set({
							Authorization: bearerToken[1]
						})
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'Group',
								id: 2,
								operation: 'READ'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('sends 404 if group doesn\'t exist', (done) => {
					request
						.get('/groups/99')
						.set({
							Authorization: bearerToken[1]
						})
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Group', 99)
						})
						.end(done)
				})
			})

			describe('POST', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('fails with 404 if group doesn\'t exist', (done) => {
					request
						.post('/groups/99')
						.set({ Authorization:  bearerToken[1] })
						.send({
							name: 'New name',
							defaultLunchTime: '14:00:00',
							defaultVoteEndingTime: '13:30:00',
							pointsPerDay: 300,
							maxPointsPerVote: 100,
							minPointsPerVote: 50
						})
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Group', 99)
						})
						.end(done)
				})

				it('fails with 403 if the user is no group admin', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[2] })
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
						.end(done)
				})

				it('requires at least one parameter', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.send({})
						.expect(400)
						.expect(res => {
							errorHelper.checkRequestError(res.body)
						})
						.end(done)
				})

				it('fails if pointsPerDay is not greater or equal than maxPointsPerVote', async () => {
					await request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.send({ pointsPerDay: 69 })
						.expect(400)
						.expect(res => {
							const expectedError = {
								field: 'pointsPerDay',
								value: 69,
								message: 'pointsPerDay has to be equal or greater than maxPointsPerVote.'
							}
							errorHelper.checkValidationError(res.body, expectedError)
						})

					await request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.send({ maxPointsPerVote: 69 })
						.expect(200)

					await request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.send({ pointsPerDay: 69 })
						.expect(200)
				})

				it('fails if defaultVoteEndingTime is greater than defaultLunchTime', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.send({
							defaultVoteEndingTime: '13:00:00',
							defaultLunchTime: '12:30:00'
						})
						.expect(400)
						.expect(res => {
							const expectedError = {
								field: 'timeValidator',
								value: null,
								message: 'defaultVoteEndingTime has to be less than defaultLunchTime.'
							}
							errorHelper.checkValidationError(res.body, expectedError)
						})
						.end(done)
				})

				it('fails if minPointsPerVote is greater than maxPointsPerVote', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
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
						.end(done)
				})

				it('fails if maxPointsPerVote is less than minPointsPerVote', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
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
						.end(done)
				})

				it('fails if maxPointsPerVote is greater than pointsPerDay', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
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
						.end(done)
				})

				it('fails if minPointsPerVote is greater than pointsPerDay', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
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
						.end(done)
				})

				it('fails if utcOffset is greater than 720', async () => {
					await request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
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
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
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
						.post('/groups/1')
						.set({ Authorization: bearerToken[1] })
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

				it('updates a group successfully', (done) => {
					request
						.post('/groups/1')
						.set( { Authorization: bearerToken[1] })
						.send({
							name: 'New name',
							defaultLunchTime: '14:00:00',
							defaultVoteEndingTime: '13:30:00',
							utcOffset: -120,
							pointsPerDay: 300,
							maxPointsPerVote: 100,
							minPointsPerVote: 50
						})
						.expect(200, (err, res) => {
							const group = res.body
							group.should.have.all.keys(['id', 'name', 'defaultLunchTime', 'defaultVoteEndingTime', 'utcOffset', 'pointsPerDay', 'maxPointsPerVote', 'minPointsPerVote', 'lunchbreaks', 'members', 'places', 'invitations'])
							group.should.have.property('id').equal(1)
							group.should.have.property('name').equal('New name')
							group.should.have.property('defaultLunchTime').equal('14:00:00')
							group.should.have.property('defaultVoteEndingTime').equal('13:30:00')
							group.should.have.property('utcOffset').equal(-120)
							group.should.have.property('pointsPerDay').equal(300)
							group.should.have.property('maxPointsPerVote').equal(100)
							group.should.have.property('minPointsPerVote').equal(50)

							const member = group.members[0]
							member.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'config'])

							done()
						})
				})

				it('converts string numbers into integers', (done) => {
					request
						.post('/groups/1')
						.set( { Authorization: bearerToken[1] })
						.send({
							name: 'New name',
							defaultLunchTime: '14:00:00',
							defaultVoteEndingTime: '13:30:00',
							pointsPerDay: '300',
							maxPointsPerVote: '100',
							minPointsPerVote: '50'
						})
						.expect(200)
						.expect(res => {
							const group = res.body
							group.should.have.property('id').equal(1)
							group.should.have.property('name').equal('New name')
							group.should.have.property('defaultLunchTime').equal('14:00:00')
							group.should.have.property('defaultVoteEndingTime').equal('13:30:00')
							group.should.have.property('pointsPerDay').equal(300)
							group.should.have.property('maxPointsPerVote').equal(100)
							group.should.have.property('minPointsPerVote').equal(50)
						})
						.end(done)
				})
			})

			describe('DELETE', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('requires admin rights', (done) => {
					request
						.delete('/groups/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'Group',
								id: 1,
								operation: 'DELETE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('deletes a group successfully', async () => {
					await request
						.delete('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})

				it('deletes all places associated to this group', async () => {
					await request
						.delete('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/places/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})

				it('deletes all lunchbreaks associated to this group', async () => {
					await request
						.delete('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/lunchbreaks/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})

				it('deletes all members of this group', async () => {
					const members = await request
						.get('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.then(res => {
							return res.body.members
						})

					await request
						.delete('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					for (const member of members) {
						await request
							.get(`/users/${member.id}/groups`)
							.set({ Authorization: bearerToken[member.id] })
							.then(res => {
								const groups = res.body

								for (const group of groups) {
									if (group.id === 1) throw new Error('User is still a member of group 1')
								}
							})
					}
				})

				it('deletes all associated invitatons', async () => {
					await request
						.delete('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/users/3/invitations')
						.set({ Authorization: bearerToken[3] })
						.expect(res => {
							const invitations = res.body
							invitations.should.be.an('array').with.lengthOf(0)
						})
				})
			})

			describe('/invitations', () => {
				describe('GET', () => {
					before(async () => {
						await setup.resetData()
					})

					it('fails if the user is no group member', async() => {
						await request
							.get('/groups/1/invitations')
							.set({ Authorization: bearerToken[3] })
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

					it('returns a collection of invitations', async () => {
						await request
							.get('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
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


								invitations.should.be.an('array').with.lengthOf(1)
								const firstInvitation = invitations[0]
								firstInvitation.should.be.eql(expected)
							})
					})
				})

				describe('POST', () => {
					beforeEach(async () => {
						await setup.resetData()
					})

					it('fails if the user is no group member', async () => {
						await request
							.post('/groups/1/invitations')
							.set({ Authorization: bearerToken[3] })
							.send({ to: 3 })
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
							.post('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
							.send({ to: 2 })
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

					it('fails if "to" is missing', async () => {
						await request
							.post('/groups/1/invitations')
							.set({ Authorization: bearerToken[2] })
							.send({ to: undefined })
							.expect(400)
							.expect(res => {
								errorHelper.checkRequestError(res.body, 'This request has to provide all of the following body values: to')
							})
					})

					it('fails if invited user is not found', async () => {
						await request
							.post('/groups/1/invitations')
							.set({ Authorization: bearerToken[2] })
							.send({ to: 9999 })
							.expect(400)
					})

					it('fails if the user is already invited', async () => {
						await request
							.post('/groups/1/invitations')
							.set({ Authorization: bearerToken[2] })
							.send({ to: 3 })
							.expect(res => {
								const errorItem = {
									field: 'to',
									value: '3',
									message: 'This user is already invited.'
								}
								errorHelper.checkValidationError(res.body, errorItem)
							})
					})

					it('creates a new invitation successfully', async () => {
						await request
							.post('/groups/1/invitations')
							.set({ Authorization: bearerToken[2] })
							.send({ to: 4 })
							.expect(200)
							.expect(res => {
								const expected = {
									group: {
										id: 1,
										name: 'Group_1'
									},
									from: {
										id: 2,
										username: 'johndoe1',
										firstName: 'John',
										lastName: 'Doe'
									},
									to: {
										id: 4,
										username: 'björn_tietgen',
										firstName: 'Björn',
										lastName: 'Tietgen'
									}
								}

								const invitation = res.body
								invitation.should.be.eql(expected)
							})
					})
				})

				describe('DELETE', () => {

					beforeEach(async () => {
						await setup.resetData()
					})

					it('requires parameter "to"', async () => {
						await request
							.delete('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
							.expect(400)
							.expect(res => {
								const error = res.body
								const values = ['to']
								errorHelper.checkRequiredQueryValues(error, values, true)
							})
					})

					it('sends NotFoundError', async () => {
						await request
							.delete('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
							.query({ to: 933492 })
							.expect(404)
							.expect(res => {
								errorHelper.checkNotFoundError(res.body, 'Invitation', null)
							})
					})

					it('admins can delete other invitations', async () => {
						await request
							.post('/groups/1/invitations')
							.set({ Authorization: bearerToken[2] })
							.send({ to: 4 })
							.expect(200)

						await request
							.delete('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
							.query({ to: 4 })
							.expect(204)

						await request
							.get('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
							.expect(200)
							.expect(res => {
								for (const invitation of res.body) {
									if (invitation.to.id === 4) {
										throw new Error('The invitation was not deleted!')
									}
								}
							})
					})

					it('members can delete their own invitations', async () => {
						await request
							.post('/groups/1/invitations')
							.set({ Authorization: bearerToken[2] })
							.send({ to: 4 })
							.expect(200)

						await request
							.delete('/groups/1/invitations')
							.set({ Authorization: bearerToken[2] })
							.query({ to: 4 })
							.expect(204)

						await request
							.get('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
							.expect(200)
							.expect(res => {
								for (const invitation of res.body) {
									if (invitation.to.id === 4) {
										throw new Error('The invitation was not deleted!')
									}
								}
							})
					})

					it('members cannot delete anothers members invitations', async () => {
						await request
							.delete('/groups/1/invitations')
							.set({ Authorization: bearerToken[2] })
							.query({ to: 3 })
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

					it('does not delete the associated users', async () => {
						await request
							.delete('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
							.query({ to: 3 })
							.expect(204)

						await request
							.get('/users/1')
							.set({ Authorization: bearerToken[1] })
							.expect(200)

						await request
							.get('/users/3')
							.set({ Authorization: bearerToken[3] })
							.expect(200)
					})

					it('does not delete the associated group', async () => {
						await request
							.delete('/groups/1/invitations')
							.set({ Authorization: bearerToken[1] })
							.query({ to: 3 })
							.expect(204)

						await request
							.get('/groups/1')
							.set({ Authorization: bearerToken[1] })
							.expect(200)
					})
				})
			})

			describe('/lunchbreaks', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				describe('GET', () => {
					before(async () => {
						await setup.resetData()
					})

					it('sends a valid lunchbreak collection', (done) => {
						request
							.get('/groups/1/lunchbreaks')
							.set({
								Authorization: bearerToken[1]
							})
							.expect(200, (err, res) => {
								const data = res.body
								data.should.have.length(2)
								data.should.be.an('array')

								const firstLunchbreak = data[0]
								firstLunchbreak.should.have.property('id').equal(1)
								firstLunchbreak.should.have.property('date').equal('2018-06-25')
								firstLunchbreak.should.have.property('lunchTime').equal('12:30:00')
								firstLunchbreak.should.have.property('voteEndingTime').equal('12:25:00')

								done()
							})
					})

					it('accepts date query', (done) => {
						request
							.get('/groups/1/lunchbreaks')
							.set({
								Authorization: bearerToken[1]
							})
							.query({
								date: '2018-06-26'
							})
							.expect(200)
							.expect(res => {
								const lunchbreak = res.body[0]
								lunchbreak.should.be.an('object')
								lunchbreak.should.have.property('id').equal(3)
								lunchbreak.should.have.property('date').equal('2018-06-26')
								lunchbreak.should.have.property('lunchTime').equal('12:30:00')
								lunchbreak.should.have.property('voteEndingTime').equal('12:25:00')
							})
							.end(done)
					})
				})

				describe('POST', () => {
					beforeEach(async () => {
						await setup.resetData()
					})

					it('fails if user is not member of the group', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[3] })
							.send({
								date: '2018-06-30',
								lunchTime: '13:00:00',
								voteEndingTime: '12:59:00'
							})
							.expect(403)
							.expect(res =>  {
								const expectedError = {
									resource: 'Lunchbreak',
									id: null,
									operation: 'CREATE'
								}
								errorHelper.checkAuthorizationError(res.body, expectedError)
							})
							.end(done)
					})

					it('fails if the user provides times and is no admin', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[2] })
							.send({
								date: '2018-06-30',
								lunchTime: '12:00:00',
								voteEndingTime: '11:59:00'
							})
							.expect(403)
							.expect(res => {
								const expectedError = {
									resource: 'Lunchbreak',
									id: null,
									operation: 'CREATE'
								}
								errorHelper.checkAuthorizationError(res.body, expectedError)
							})
							.end(done)
					})

					it('creates a new lunchbreak successfully when user is no admin', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[2] })
							.send({ date: '2018-06-30' })
							.expect(200)
							.expect(res => {
								const lunchbreak = res.body
								lunchbreak.should.have.property('id')
								lunchbreak.should.have.property('groupId').equal(1)
								lunchbreak.should.have.property('date').equal('2018-06-30')
								lunchbreak.should.have.property('lunchTime').equal('12:30:00')
								lunchbreak.should.have.property('voteEndingTime').equal('12:25:00')
							})
							.end(done)
					})

					it('creates a new lunchbreak successfully when user is admin', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[1] })
							.send({
								date: '2018-06-30',
								lunchTime: '12:00:00',
								voteEndingTime: '11:59:00'
							})
							.expect(200, (err, res) => {
								const newLunchbreak = res.body
								newLunchbreak.should.have.property('id')
								newLunchbreak.should.have.property('groupId').equal(1)
								newLunchbreak.should.have.property('date').equal('2018-06-30')
								newLunchbreak.should.have.property('lunchTime').equal('12:00:00')
								newLunchbreak.should.have.property('voteEndingTime').equal('11:59:00')
								done()
							})
					})

					it('creates a new lunchbreak with default values if none are provided', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[2] })
							.send({
								date: '2018-06-30'
							})
							.expect(200, (err, res) => {
								const newLunchbreak = res.body
								newLunchbreak.should.have.property('id')
								newLunchbreak.should.have.property('date').equal('2018-06-30')
								newLunchbreak.should.have.property('lunchTime').equal('12:30:00')
								newLunchbreak.should.have.property('voteEndingTime').equal('12:25:00')
								done()
							})
					})

					it('fails if no date is provided', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[2] })
							.send({})
							.expect(400)
							.expect(res => {
								errorHelper.checkRequestError(res.body)
							})
							.end(done)
					})

					it('fails if voteEndingTime is greater than lunchTime', (done) => {{
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[1] })
							.send({
								date: '2018-06-30',
								lunchTime: '12:30:00',
								voteEndingTime: '12:31:00'
							})
							.expect(400)
							.expect(res => {
								const expectedError = {
									field: 'voteEndingTime',
									value: '12:31:00',
									message: 'voteEndingTime cannot be greater than lunchTime.'
								}
								errorHelper.checkValidationError(res.body, expectedError)
							})
							.end(done)
					}})

					it('fails if a lunchbreak at this date exists', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[2] })
							.send({
								date: '2018-06-25'
							})
							.expect(400)
							.expect(res => {
								const expectedError = {
									field: 'date',
									value: '2018-06-25',
									message: 'A lunchbreak at this date already exists.'
								}

								errorHelper.checkValidationError(res.body, expectedError)
							})
							.end(done)
					})
				})
			})

			describe('/members', () => {
				describe('GET', () => {
					before(async () => {
						await setup.resetData()
					})

					it('requires a user to be a member of the group', (done) => {
						request
							.get('/groups/1/members')
							.set({ Authorization: bearerToken[3] })
							.expect(403)
							.expect(res => {
								const expectedError = {
									resource: 'GroupMemberCollection',
									id: null,
									operation: 'READ'
								}
								errorHelper.checkAuthorizationError(res.body, expectedError)
							})
							.end(done)
					})

					it('sends a valid member collection', (done) => {
						request
							.get('/groups/1/members')
							.set({
								Authorization: bearerToken[1]
							})
							.expect(200, (err, res) => {
								const data = res.body
								data.should.be.an('array')
								data.should.have.length(2)

								const firstMember = data[0]
								firstMember.should.have.all.keys(['id', 'username', 'firstName', 'lastName', 'config'])
								firstMember.should.have.property('id').equal(1)
								firstMember.should.have.property('firstName').equal('Max')
								firstMember.should.have.property('lastName').equal('Mustermann')
								firstMember.should.have.property('username').equal('maxmustermann')
								firstMember.should.have.property('config').which.has.property('color').equal('#90ba3e')
								firstMember.should.have.property('config').which.has.property('isAdmin').equal(true)
								done()
							})
					})
				})

				describe('/:userId', () => {
					it('returns a 404 if user is no group member', (done) => {
						request
							.post('/groups/1/members/404')
							.set({ Authorization: bearerToken[1] })
							.expect(404)
							.expect(res => {
								errorHelper.checkNotFoundError(res.body, 'GroupMember', 404)
							})
							.end(done)
					})

					describe('POST', () => {
						beforeEach(async () => {
							await setup.resetData()
						})

						it('allows an user to change his color', (done) => {
							request
								.post('/groups/1/members/2')
								.set({ Authorization: bearerToken[2] })
								.send({ color: '#eeeeee' })
								.expect(200)
								.expect(res => {
									const member = res.body
									member.should.have.property('color').equal('#eeeeee')
								})
								.end(done)
						})

						it('allows an admin to change another member', (done) => {
							request
								.post('/groups/1/members/2')
								.set({ Authorization: bearerToken[1] })
								.send({ color: '#fafafa', isAdmin: true })
								.expect(200)
								.expect(res => {
									const member = res.body
									member.should.have.property('color').equal('#fafafa')
									member.should.have.property('isAdmin').equal(true)
								})
								.end(done)
						})

						it('successfully grants and revokes a users admin rights', (done) => {
							request
								.post('/groups/1/members/2')
								.set({ Authorization: bearerToken[1] })
								.send({ isAdmin: true })
								.expect(200)
								.expect(res => {
									const member = res.body
									member.should.have.property('isAdmin').equal(true)
								})
								.then(() => {
									request
										.post('/groups/1/members/2')
										.set({ Authorization: bearerToken[1] })
										.send({ isAdmin: false })
										.expect(200)
										.expect(res => {
											const member = res.body
											member.should.have.property('isAdmin').equal(false)
										})
										.end(done)
								})
						})

						it('fails if a non admin member tries to change another member', (done) => {
							request
								.post(('/groups/1/members/1'))
								.set({ Authorization: bearerToken[2] })
								.expect(403)
								.expect(res => {
									const expectedError = {
										resource: 'GroupMember',
										id: 1,
										operation: 'UPDATE'
									}
									errorHelper.checkAuthorizationError(res.body, expectedError)
								})
								.end(done)
						})

						it('fails if a non admin tries to get admin rights', async () => {
							const TRUTHY = [true, 'true', 1, '1']

							for (const val of TRUTHY) {
								await request
									.post('/groups/1/members/2')
									.set({ Authorization: bearerToken[2] })
									.send({ isAdmin: val })
									.expect(403)
									.expect(res => {
										const expectedError = {
											resource: 'GroupMember',
											id: 2,
											operation: 'UPDATE'
										}
										errorHelper.checkAuthorizationError(res.body, expectedError)
									})
							}
						})

						it('fails if the user is the groups last admin', (done) => {
							request
								.post('/groups/1/members/1')
								.set({ Authorization: bearerToken[1] })
								.send({ isAdmin: false })
								.expect(403)
								.expect(res => {
									const expectedError = {
										resource: 'GroupMember',
										id: 1,
										operation: 'UPDATE',
										message: 'This user is the last admin of this group and cannot revoke his rights.'
									}
									errorHelper.checkAuthorizationError(res.body, expectedError)
								})
								.end(done)
						})
					})

					describe('DELETE', () => {
						beforeEach(async () => {
							await setup.resetData()
						})

						it('requires group admin rights to remove other members', (done) => {
							request
								.delete('/groups/1/members/1')
								.set({ Authorization: bearerToken[2] })
								.expect(403)
								.expect(res => {
									const expectedError = {
										resource: 'GroupMember',
										id: 1,
										operation: 'DELETE'
									}
									errorHelper.checkAuthorizationError(res.body, expectedError)
								})
								.end(done)
						})

						it('lets the admins remove other group members', (done) => {
							request
								.delete('/groups/1/members/2')
								.set({ Authorization: bearerToken[1] })
								.expect(204, done)
						})

						it('allows a user to leave a group', (done) => {
							request
								.delete('/groups/1/members/2')
								.set({ Authorization: bearerToken[2] })
								.expect(204, done)
						})

						it('fails if the user is the groups last admin', (done) => {
							request
								.delete('/groups/1/members/1')
								.set({ Authorization: bearerToken[1] })
								.expect(403)
								.expect(res => {
									const expectedError = {
										resource: 'GroupMember',
										id: 1,
										operation: 'DELETE',
										message: 'You are the last administrator of this group and cannot leave the group.'
									}
									errorHelper.checkAuthorizationError(res.body, expectedError)
								})
								.end(done)
						})

						it('does not delete the associated group', async () => {
							await request
								.delete('/groups/1/members/2')
								.set({ Authorization: bearerToken[2] })
								.expect(204)

							await request
								.get('/groups/1')
								.set({ Authorization: bearerToken[1] })
								.expect(200)
						})

						it('does not delete the associated user', async () => {
							await request
								.delete('/groups/1/members/2')
								.set({ Authorization: bearerToken[2] })
								.expect(204)

							await request
								.get('/users/2/')
								.set({ Authorization: bearerToken[2] })
								.expect(200)
						})
					})
				})
			})

			describe('/places', () => {
				describe('GET', () => {
					before(async () => {
						await setup.resetData()
					})

					it('sends a valid place collection', (done) => {
						request
							.get('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.expect(200)
							.expect(res => {
								const collection = res.body
								collection.should.be.an('array')
								collection.should.have.length(4)

								const place = collection[0]
								place.should.have.property('id').equal(1)
								place.should.have.property('foodType').equal('Döner')
								place.should.have.property('name').equal('VIP-Döner')
							})
							.end(done)
					})
				})

				describe('POST', () => {
					let newPlace

					beforeEach(async () => {
						await setup.resetData()
						newPlace = {
							name: 'NewPlace',
							foodType: 'Italian'
						}
					})

					it('requires group admin rights', (done) => {
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[2] })
							.send(newPlace)
							.expect(403)
							.expect(res => {
								const expectedError = {
									resource: 'Place',
									id: null,
									operation: 'CREATE'
								}
								errorHelper.checkAuthorizationError(res.body, expectedError)
							})
							.end(done)
					})

					it('fails if the foodType is empty', (done) => {
						newPlace.foodType = ''
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.send(newPlace)
							.expect(400)
							.expect(res => {
								const expectedError = {
									field: 'foodType',
									value: newPlace.foodType,
									message: 'foodType cannot be empty.'
								}
								errorHelper.checkValidationError(res.body, expectedError)
							})
							.end(done)
					})

					it('creates a new place correctly', (done) => {
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.send(newPlace)
							.expect(200)
							.expect(response => {
								const place = response.body
								place.should.have.property('id')
								place.should.have.property('name').equal(newPlace.name)
								place.should.have.property('foodType').equal(newPlace.foodType)
								place.should.have.property('groupId').equal(1)
							})
							.end(done)
					})

					it('sends 400 if no name and foodType is provided', (done) => {
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.send( {} )
							.expect(400)
							.expect(res => {
								const message = 'This request has to provide all of the following body values: foodType, name'
								errorHelper.checkRequestError(res.body, message)
							})
							.end(done)
					})
				})
			})
		})
	})
}
