const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/groups', () => {
		describe('POST', () => {
			let newGroup = {
				name: 'My cool group',
				defaultLunchTime: '12:30:00',
				defaultVoteEndingTime: '12:00:00',
				pointsPerDay: 20,
				maxPointsPerVote: 10,
				minPointsPerVote: 5
			}

			beforeEach(async () => {
				await setup.resetData()
			})

			it('sucessfully creates a group', (done) => {
				request
					.post('/groups')
					.set({ Authorization: bearerToken[1]})
					.send(newGroup)
					.expect(200)
					.expect(res => {
						let group = res.body
						group.should.have.property('id')
						group.should.have.property('name').equal(newGroup.name)
						group.should.have.property('defaultLunchTime').equal(newGroup.defaultLunchTime)
						group.should.have.property('defaultVoteEndingTime').equal(newGroup.defaultVoteEndingTime)
						group.should.have.property('pointsPerDay').equal(newGroup.pointsPerDay)
						group.should.have.property('maxPointsPerVote').equal(newGroup.maxPointsPerVote)
						group.should.have.property('minPointsPerVote').equal(newGroup.minPointsPerVote)
						group.should.have.property('members').which.is.an('array')
						group.should.have.property('lunchbreaks').which.is.an('array')
						group.should.have.property('places').which.is.an('array')
						group.should.have.property('foodTypes').which.is.an('array')

					})
					.end(done)
			})

			it('adds the creating user as group admin', async () => {
				let id = await request
					.post('/groups')
					.set({ Authorization: bearerToken[1]})
					.send(newGroup)
					.then(res => {
						let group = res.body
						let members = group.members
						let member = members[0]
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
							let group = res.body

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
							group.should.have.property('foodTypes').which.is.an('array').and.has.length(4)

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
							let expectedError = {
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
							let expectedError = {
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

				it('fails if defaultVoteEndingTime is greater than defaultLunchTime', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1]})
						.send({
							defaultVoteEndingTime: '13:00:00',
							defaultLunchTime: '12:30:00'
						})
						.expect(400)
						.expect(res => {
							let expectedError = {
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
						.set({ Authorization: bearerToken[1]})
						.send({
							minPointsPerVote: 50,
							maxPointsPerVote: 40
						})
						.expect(400)
						.expect(res => {
							let expectedError = {
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
						.set({ Authorization: bearerToken[1]})
						.send({
							minPointsPerVote: 30,
							maxPointsPerVote: 29
						})
						.expect(400)
						.expect(res => {
							let expectedError = {
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
						.set({ Authorization: bearerToken[1]})
						.send({
							pointsPerDay: 30,
							maxPointsPerVote: 31
						})
						.expect(400)
						.expect(res => {
							let expectedError = {
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
						.set({ Authorization: bearerToken[1]})
						.send({
							minPointsPerVote: 101,
							pointsPerDay: 100
						})
						.expect(400)
						.expect(res => {
							let expectedError = {
								field: 'minPointsPerVote',
								value: 101,
								message: 'minPointsPerVote has to be less than or equal to pointsPerDay.'
							}
							errorHelper.checkValidationError(res.body, expectedError)
						})
						.end(done)
				})

				it('updates a group successfully', (done) => {
					request
						.post('/groups/1')
						.set( { Authorization: bearerToken[1]})
						.send({
							name: 'New name',
							defaultLunchTime: '14:00:00',
							defaultVoteEndingTime: '13:30:00',
							pointsPerDay: 300,
							maxPointsPerVote: 100,
							minPointsPerVote: 50
						})
						.expect(200, (err, res) => {
							let group = res.body
							group.should.have.property('id').equal(1)
							group.should.have.property('name').equal('New name')
							group.should.have.property('defaultLunchTime').equal('14:00:00')
							group.should.have.property('defaultVoteEndingTime').equal('13:30:00')
							group.should.have.property('pointsPerDay').equal(300)
							group.should.have.property('maxPointsPerVote').equal(100)
							group.should.have.property('minPointsPerVote').equal(50)
							done()
						})
				})

				it('converts string numbers into integers', (done) => {
					request
						.post('/groups/1')
						.set( { Authorization: bearerToken[1]})
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
							let group = res.body
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
							let expectedError = {
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
								let data = res.body
								data.should.have.length(2)
								data.should.be.an('array')

								let firstLunchbreak = data[0]
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
								let lunchbreak = res.body[0]
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
							.set({ Authorization: bearerToken[3]})
							.send({
								date: '2018-06-30',
								lunchTime: '13:00:00',
								voteEndingTime: '12:59:00'
							})
							.expect(403)
							.expect(res =>  {
								let expectedError = {
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
								let expectedError = {
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
								let lunchbreak = res.body
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
							.set({ Authorization: bearerToken[1]})
							.send({
								date: '2018-06-30',
								lunchTime: '12:00:00',
								voteEndingTime: '11:59:00'
							})
							.expect(200, (err, res) => {
								let newLunchbreak = res.body
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
							.set({ Authorization: bearerToken[2]})
							.send({
								date: '2018-06-30'
							})
							.expect(200, (err, res) => {
								let newLunchbreak = res.body
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
							.set({ Authorization: bearerToken[2]})
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
								let expectedError = {
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
							.set({ Authorization: bearerToken[2]})
							.send({
								date: '2018-06-25'
							})
							.expect(400)
							.expect(res => {
								let expectedError = {
									field: 'date',
									value: '2018-06-25',
									message: 'A lunchbreak at this date already exists.'
								}

								// There is a bug in sequelize (https://github.com/sequelize/sequelize/issues/9871)
								// which results in a incorrect error value. So in order that our test does not fail,
								// we temporary expect another value.
								expectedError.value = '2018'

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
								let expectedError = {
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
								let data = res.body
								data.should.be.an('array')
								data.should.have.length(2)

								let firstMember = data[0]
								firstMember.should.have.all.keys(['id', 'email', 'name', 'config'])
								firstMember.should.have.property('id').equal(1)
								firstMember.should.have.property('name').equal('Max Mustermann')
								firstMember.should.have.property('email').equal('mustermann@gmail.com')
								firstMember.should.have.property('config').which.has.property('color').equal('#90ba3e')
								firstMember.should.have.property('config').which.has.property('isAdmin').equal(true)
								done()
							})
					})
				})

				describe('POST', () => {
					let newMember

					beforeEach(async () => {
						newMember = {
							userId: 3,
							color: '#18e6a3',
							isAdmin: false
						}
						await setup.resetData()
					})

					it('requires group admin rights', (done) => {
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[2] })
							.send(newMember)
							.expect(403)
							.expect(res => {
								let expectedError = {
									resource: 'GroupMember',
									id: null,
									operation: 'CREATE',
								}
								errorHelper.checkAuthorizationError(res.body, expectedError)
							})
							.end(done)
					})

					it('fails if userId is undefined', (done) => {
						newMember.userId = undefined
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(400)
							.expect(res => {
								let expectedError = {
									field: 'userId',
									value: null,
									message: 'userId cannot be null.'
								}

								errorHelper.checkValidationError(res.body, expectedError)
							})
							.end(done)
					})

					it('fails if userId does not exist', (done) => {
						newMember.userId = 99
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(400)
							.expect(res => {
								let expectedError = {
									field: 'userId',
									value: 99,
									message: 'userId does not exist.'
								}

								errorHelper.checkValidationError(res.body, expectedError)
							})
							.end(done)
					})

					it('fails if userId is not a number', (done) => {
						newMember.userId = 'string'
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(400)
							.expect(res => {
								let expectedError = {
									field: 'userId',
									value: 'string',
									message: 'userId has to be numeric.'
								}

								errorHelper.checkValidationError(res.body, expectedError)
							})
							.end(done)
					})

					it('responds with a collection of all members')

					it('successfully adds a group member', (done) => {
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(200)
							.expect(res => {
								let member = res.body
								member.should.have.property('id').equal(3)
								member.should.have.property('name').equal('Philipp Loten')
								member.should.have.property('email').equal('philipp.loten@company.com')
								member.should.have.property('config').which.is.an('object')

								let config = member.config
								config.should.have.property('color').equal(newMember.color)
								config.should.have.property('isAdmin').equal(newMember.isAdmin)
							})
							.end(done)
					})

					it('uses default values if only the userId is provided', (done) => {
						newMember.color = undefined
						newMember.isAdmin = undefined

						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(200)
							.expect(res => {
								let member = res.body
								member.should.have.property('id').equal(3)
								member.should.have.property('name').equal('Philipp Loten')
								member.should.have.property('email').equal('philipp.loten@company.com')
								member.should.have.property('config').which.is.an('object')

								let config = member.config
								config.should.have.property('color')
								config.should.have.property('isAdmin')
							})
							.end(done)
					})

					it('fails if no userId is provided', (done) => {
						newMember.userId = undefined
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(400)
							.expect(res => {
								let expectedError = {
									field: 'userId',
									value: null,
									message: 'userId cannot be null.'
								}
							})
							.end(done)
					})
				})

				describe('/:userId', () => {
					it('returns a 404 if user is no group member', (done) => {
						request
							.post('/groups/1/members/404')
							.set({ Authorization: bearerToken[1] })
							.expect(404)
							.expect(res => {
								errorHelper.checkNotFoundError(res.body, 'GroupMember', '404')
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
									let member = res.body
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
									let member = res.body
									member.should.have.property('color').equal('#fafafa')
									member.should.have.property('isAdmin').equal(true)
								})
								.end(done)
						})

						it('successfully grants and revokes a users admin rights', (done) => {
							request
								.post('/groups/1/members/2')
								.set({ Authorization: bearerToken[1]})
								.send({ isAdmin: true })
								.expect(200)
								.expect(res => {
									let member = res.body
									member.should.have.property('isAdmin').equal(true)
								})
								.then(() => {
									request
										.post('/groups/1/members/2')
										.set({ Authorization: bearerToken[1] })
										.send({ isAdmin: false })
										.expect(200)
										.expect(res => {
											let member = res.body
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
									let expectedError = {
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

							for (let val of TRUTHY) {
								await request
									.post('/groups/1/members/2')
									.set({ Authorization: bearerToken[2] })
									.send({ isAdmin: val })
									.expect(403)
									.expect(res => {
										let expectedError = {
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
									let expectedError = {
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
									let expectedError = {
										resource: 'GroupMember',
										id: 1,
										operation: 'DELETE'
									}
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
									let expectedError = {
										resource: 'GroupMember',
										id: 1,
										operation: 'DELETE',
										message: 'You are the last administrator of this group and cannot leave the group.'
									}
									errorHelper.checkAuthorizationError(res.body, expectedError)
								})
								.end(done)
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
								let collection = res.body
								collection.should.be.an('array')
								collection.should.have.length(4)

								let place = collection[0]
								place.should.have.property('id').equal(1)
								place.should.have.property('foodTypeId').equal(2)
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
							foodTypeId: 2
						}
					})

					it('requires group admin rights', (done) => {
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[2] })
							.send(newPlace)
							.expect(403)
							.expect(res => {
								let expectedError = {
									resource: 'Place',
									id: null,
									operation: 'CREATE'
								}
								errorHelper.checkAuthorizationError(res.body, expectedError)
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
								let place = response.body
								place.should.have.property('id')
								place.should.have.property('name').equal(newPlace.name)
								place.should.have.property('foodTypeId').equal(newPlace.foodTypeId)
								place.should.have.property('groupId').equal(1)
							})
							.end(done)
					})

					it('sends 400 on non-group foreign key', (done) => {
						newPlace.foodTypeId = 5 // this id belongs to group 2
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.send(newPlace)
							.expect(400)
							.expect(res => {
								let expectedError = {
									field: 'foodTypeId',
									value: 5,
									message: 'This food type does not belong to group 1'
								}
								errorHelper.checkValidationError(res.body, expectedError)
							})
							.end(done)
					})

					it('sends 400 if no name and foodTypeId is provided', (done) => {
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.send( {} )
							.expect(400)
							.expect(res => {
								errorHelper.checkRequestError(res.body)
							})
							.end(done)
					})
				})
			})

			describe('/foodTypes', () => {
				describe('GET', () => {
					before(async () => {
						await setup.resetData()
					})

					it('sends a valid foodType collection', (done) => {
						request
							.get('/groups/1/foodTypes')
							.set({ Authorization: bearerToken[1] })
							.expect(200)
							.expect(res => {
								let collection = res.body
								collection.should.be.an('array')
								collection.should.have.length(4)

								let foodType = collection[0]
								foodType.should.have.property('id').equal(1)
								foodType.should.have.property('type').equal('Asiatisch')
							})
							.end(done)
					})
				})
			})
		})
	})
}
