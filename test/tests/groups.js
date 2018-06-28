const setup = require('./../data/setup')

module.exports = (request, token) => {
	return describe('/groups', () => {
		describe('GET', () => {
			it('requires authentication', (done) => {
				request
					.get('/groups')
					.expect(401, done)
			})
		})

		describe('/:groupId', () => {
			describe('GET', () => {
				it('sends a valid group-resource', (done) => {
					request
						.get('/groups/1')
						.set({
							Authorization: 'Bearer ' + token[1]
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
							group.should.have.property('places').which.is.an('array').and.has.length(0)
							group.should.have.property('foodTypes').which.is.an('array').and.has.length(0)

							done()
						})
				})

				it('sends 403 if user isn\'t a group member', (done) => {
					request
						.get('/groups/2')
						.set({
							Authorization: 'Bearer ' + token[1]
						})
						.expect(403, done)
				})

				it('sends 404 if group doesn\'t exist', (done) => {
					request
						.get('/groups/99')
						.set({
							Authorization: 'Bearer ' + token[1]
						})
						.expect(404, done)
				})
			})

			describe('POST', () => {
				beforeEach(async () => {
					await setup.setupDatabase()
				})

				after(async () => {
					await setup.setupDatabase()
				})

				it('requires authentication', (done) => {
					request
						.post('/groups/1')
						.expect(401, done)
				})

				it('fails with 404 if group doesn\'t exist', (done) => {
					request
						.post('/groups/99')
						.set({ Authorization: 'Bearer ' +  token[1] })
						.expect(404, done)
				})

				it('fails with 403 if the user is no group admin', (done) => {
					request
						.post('/groups/1')
						.set({
							Authorization: 'Bearer ' + token[2]
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
							Authorization: 'Bearer ' + token[1]
						})
						.send({})
						.expect(400, done)
				})

				it('updates a group successfully', (done) => {
					request
						.post('/groups/1')
						.set( { Authorization: 'Bearer ' + token[1]})
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
								Authorization: 'Bearer ' + token[1]
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

				describe.skip('POST', () => {
					beforeEach(() => {
						setup.setupDatabase()
					})

					it('fails if user is not member of the group', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: 'Bearer ' + token[3]})
							.send({
								date: '2018-06-30',
								lunchTime: '13:00:00',
								voteEndingTime: '12:59:00'
							})
							.expect(403, done)
					})
					
					it('creates a new lunchbreak successfully', (done) => {
						request
							.post('/groups/1/lunchbreaks')
							.set({ Authorization: 'Bearer ' + token[2]})
							.send({
								date: '2018-06-30',
								lunchTime: '12:00:00',
								voteEndingTime: '11:59:00'
							})
							.expect(200, (err, res) => {
								let newLunchbreak = res.body
								newLunchbreak.should.have.property('id')
								newLunchbreak.should.have.property('date').equal('2018-06-30')
								newLunchbreak.should.have.property('lunchTime').equal('12:00:00')
								newLunchbreak.should.have.property('voteEndingTime').equal('11:59:00')
								done()
							})
					})

					it('creates a new lunchbreak with default values if none are provided', (done) => {
						request
							.post('groups/1/lunchbreaks')
							.set({ Authorization: 'Bearer ' + token[2]})
							.send({
								date: '2018-06-30'
							})
							.expect(200, (err, res) => {
								let newLunchbreak = res.body
								newLunchbreak.should.have.property('id')
								newLunchbreak.should.have.property('date').equal('2018-06-30')
								newLunchbreak.should.have.property('lunchTime').equal('13:00:00')
								newLunchbreak.should.have.property('voteEndingTime').equal('12:59:00')
								done()
							})
					})

					it('fails if no date is provided', (done) => {
						request	
							.post('groups/1/lunchbreaks')
							.set({ Authorization: 'Bearer ' + token[2]})
							.send({})
							.expect(400, done)
					})

					it('fails if voteEndingTime is greater than lunchTime', (done) => {{
						request
							.post('groups/1/lunchbreaks')
							.set({ Authorization: 'Bearer ' + token[2]})
							.send({
								date: '2018-06-30',
								lunchTime: '12:30:00',
								voteEndingTime: '12:31:00'
							})
							.expect(400, done)
					}})

					it('fails if a lunchbreak at this date exists', (done) => {
						request
							.post('groups/1/lunchbreaks')
							.set({ Authorization: 'Bearer ' + token[2]})
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
								Authorization: 'Bearer ' + token[1]
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
			})
		})
	})
}