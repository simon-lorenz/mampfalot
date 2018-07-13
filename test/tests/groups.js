const setup = require('../setup')

module.exports = (request, bearerToken) => {
	return describe('/groups', () => {
		describe('GET', () => {
			it('requires authentication', (done) => {
				request
					.get('/groups')
					.expect(401, done)
			})
		})

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

			it('requires authentication', (done) => {
				request
					.post('/groups')
					.send(newGroup)
					.expect(401, done)
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
					})
					.end(done)	
			})

			it('adds the creating user as group admin', async () => {
				let id = await request
					.post('/groups')
					.set({ Authorization: bearerToken[1]})
					.send(newGroup)
					.then(result => {
						return result.body.id
					})

				await request	
					.get('/groups/' + id + '/members')
					.set({ Authorization: bearerToken[1]})
					.expect(200)
					.expect(res => {
						let member = res.body[0]
						member.should.have.property('id').equal(1)
						member.should.have.property('config').which.has.property('authorizationLevel').equal(1)
					})
			})
		})

		describe('/:groupId', () => {
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
						.expect(403, done)
				})

				it('sends 404 if group doesn\'t exist', (done) => {
					request
						.get('/groups/99')
						.set({
							Authorization: bearerToken[1]
						})
						.expect(404, done)
				})
			})

			describe('POST', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('requires authentication', (done) => {
					request
						.post('/groups/1')
						.expect(401, done)
				})

				it('fails with 404 if group doesn\'t exist', (done) => {
					request
						.post('/groups/99')
						.set({ Authorization:  bearerToken[1] })
						.expect(404, done)
				})

				it('fails with 403 if the user is no group admin', (done) => {
					request
						.post('/groups/1')
						.set({
							Authorization: bearerToken[2]
						})
						.send({
							name: 'New name'
						})
						.expect(403, done)
				})

				it('requires at least one parameter', (done) => {
					request
						.post('/groups/1')
						.set({
							Authorization: bearerToken[1]
						})
						.send({})
						.expect(400, done)
				})

				it('fails if defaultVoteEndingTime is greater than defaultLunchTime', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1]})
						.send({
							defaultVoteEndingTime: '13:00:00',
							defaultLunchTime: '12:30:ßß'
						})
						.expect(400, done)
				})

				it('fails if minPointsPerVote is greater than maxPointsPerVote', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1]})
						.send({
							minPointsPerVote: 50,
							maxPointsPerVote: 40
						})
						.expect(400, done)
				})

				it('fails if maxPointsPerVote is greater than pointsPerDay', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1]})
						.send({
							pointsPerDay: 30,
							maxPointsPerVote: 100
						})
						.expect(400, done)
				})

				it('fails if minPointsPerVote is greater than pointsPerDay', (done) => {
					request
						.post('/groups/1')
						.set({ Authorization: bearerToken[1]})
						.send({
							minPointsPerVote: 1000,
							pointsPerDay: 100
						})
						.expect(400, done)
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
			})

			describe('/lunchbreaks', () => {
				describe('GET', () => {
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
							.expect(403, done)
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
							.expect(403, done)
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
							.expect(400, (err, res) => {
								done(err)
							})
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
							.expect(400, done)
					}})

					it('fails if a lunchbreak at this date exists', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: bearerToken[2]})
							.send({
								date: '2018-06-25'
							})
							.expect(400, done)
					})
				})
			})

			describe('/members', () => {
				describe('GET', () => {
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
								firstMember.should.have.property('id').equal(1)
								firstMember.should.have.property('email').equal('mustermann@gmail.com')
								firstMember.should.have.property('config').which.has.property('color').equal('90ba3e')
								firstMember.should.have.property('config').which.has.property('authorizationLevel').equal(1)
								done()
							})
					})
				})

				describe('POST', () => {
					let newMember

					beforeEach(async () => {
						newMember = {
							userId: 3,
							color: '18e6a3',
							authorizationLevel: 0
						}
						await setup.resetData()
					})

					it('requires group admin rights', (done) => {
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[2] })
							.send(newMember)
							.expect(403, done)
					})

					it('successfully adds a group member', (done) => {
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(200)
							.expect(res => {
								let member = res.body
								member.should.have.property('groupId').equal(1)
								member.should.have.property('color').equal(newMember.color)
								member.should.have.property('authorizationLevel').equal(newMember.authorizationLevel)
							})
							.end(done)
					})

					it('uses default values if only the userId is provided', (done) => {
						newMember.color = undefined
						newMember.authorizationLevel = undefined

						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(200)
							.expect(res => {
								let member = res.body
								member.should.have.property('groupId').equal(1)
								member.should.have.property('color')
								member.should.have.property('authorizationLevel').equal(0)
							})
							.end(done)
					})

					it('fails if no userId is provided', (done) => {
						newMember.userId = undefined
						request
							.post('/groups/1/members')
							.set({ Authorization: bearerToken[1] })
							.send(newMember)
							.expect(400, done)
					})
				})

				describe('/:userId', () => {
					describe('POST', () => {
						beforeEach(async () => {
							await setup.resetData()
						})

						it('requires auth', (done) => {
							request
								.post('/groups/1/members/1')
								.expect(401, done)
						})

						it('allows an user to change his color', (done) => {
							request
								.post('/groups/1/members/2')
								.set({ Authorization: bearerToken[2] })
								.send({ color: 'eeeeee' })
								.expect(200)
								.expect(res => {
									member = res.body
									member.should.have.property('color').equal('eeeeee')
								})
								.end(done)
						})

						it('allows an admin to change another member', (done) => {
							request
								.post('/groups/1/members/2')
								.set({ Authorization: bearerToken[1] })
								.send({ color: 'fafafa', authorizationLevel: 1 })
								.expect(200)
								.expect(res => {
									member = res.body
									member.should.have.property('color').equal('fafafa')
									member.should.have.property('authorizationLevel').equal(1)									
								})
								.end(done)
						})

						it('fails if a non admin member tries to change another member', (done) => {
							request
								.post(('/groups/1/members/1'))
								.set({ Authorization: bearerToken[2] })
								.expect(403, done)
						})
					})

					describe('DELETE', () => {
						beforeEach(async () => {
							await setup.resetData()
						})

						it('requires auth', (done) => {
							request
								.delete('/groups/1/members/1')
								.expect(401, done)
							})

						it('requires group admin rights to remove other members', (done) => {
							request
								.delete('/groups/1/members/1')
								.set({ Authorization: bearerToken[2] })
								.expect(403, done)
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
					})
				})
			})

			describe('/places', () => {
				describe('GET', () => {
					it('requires authentication', (done) => {
						request
							.get('/groups/1/places')
							.expect(401, done)
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
							.expect(403, done)
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

					it('sends 400 on non existent foreign key', (done) => {
						newPlace.foodTypeId = 99 // non existent foodTypeId
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.send(newPlace)
							.expect(400, done)
					})

					it('sends 400 on non-group foreign key', (done) => {
						newPlace.foodTypeId = 5 // this id belongs to group 2
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.send(newPlace)
							.expect(400, done)
					})

					it('sends 400 if no name and foodTypeId is provided', (done) => {
						request
							.post('/groups/1/places')
							.set({ Authorization: bearerToken[1] })
							.send( {} )
							.expect(400, done)
					})
				})
			})

			describe('/foodTypes', () => {
				describe('GET', () => {
					it('requires authentication', (done) => {
						request
							.get('/groups/1/foodTypes')
							.expect(401, done)
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

				describe('POST', () => {
					let newFoodType

					beforeEach(async () => {
						newFoodType = {
							type: 'Neu!'
						}	
						await setup.resetData()
					})

					it('requires admin rights', (done) => {
						request
							.post('/groups/1/foodTypes')
							.set({ Authorization: bearerToken[2] })
							.expect(403, done)
					})

					it('sends 400 if no type is specified', (done) => {
						request
							.post('/groups/1/foodTypes')
							.set({ Authorization: bearerToken[1] })
							.send( { } )
							.expect(400, done)
					})

					it('fails if type already exists', (done) => {
						newFoodType.type = 'Döner'

						request
							.post('/groups/1/foodTypes')
							.set({ Authorization: bearerToken[1] })
							.send(newFoodType)
							.expect(400, done)							
					})

					it('inserts a new foodType correctly', (done) => {
						request
							.post('/groups/1/foodTypes')
							.set({ Authorization: bearerToken[1] })
							.send(newFoodType)
							.expect(200)
							.expect(response => {
								let foodType = response.body
								foodType.should.have.property('id')
								foodType.should.have.property('type').equal(newFoodType.type)								
							})
							.end(done)
					})
				})
			})
		})
	})
} 