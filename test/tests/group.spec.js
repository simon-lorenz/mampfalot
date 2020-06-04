const Boom = require('@hapi/boom')
const setupDatabase = require('../utils/scripts/setup-database')
const testData = require('../utils/scripts/test-data')
const request = require('supertest')('http://localhost:5001')
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
					.send({})
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message:
							'"name" is required. "lunchTime" is required. "voteEndingTime" is required. "utcOffset" is required. "pointsPerDay" is required. "minPointsPerVote" is required. "maxPointsPerVote" is required',
						validation: {
							source: 'payload',
							keys: [
								'name',
								'lunchTime',
								'voteEndingTime',
								'utcOffset',
								'pointsPerDay',
								'minPointsPerVote',
								'maxPointsPerVote'
							]
						}
					})
			})

			it('fails if pointsPerDay is not a number between 1 and 1000', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						pointsPerDay: 0
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"pointsPerDay" must be larger than or equal to 1')
						res.body.validation.keys.should.contain('pointsPerDay')
					})

				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						pointsPerDay: 1001
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"pointsPerDay" must be less than or equal to 1000')
						res.body.validation.keys.should.contain('pointsPerDay')
					})
			})

			it('fails if maxPointsPerVote not a number between minPointsPerVote and pointsPerDay', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						pointsPerDay: 99,
						maxPointsPerVote: 100,
						minPointsPerVote: 10
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"maxPointsPerVote" must be less than or equal to ref:pointsPerDay')
						res.body.validation.keys.should.contain('maxPointsPerVote')
					})

				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						pointsPerDay: 100,
						maxPointsPerVote: 9,
						minPointsPerVote: 10
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"maxPointsPerVote" must be larger than or equal to ref:minPointsPerVote')
						res.body.validation.keys.should.contain('maxPointsPerVote')
					})
			})

			it('fails if minPointsPerVote is not a number between 1 and pointsPerDay', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						pointsPerDay: 100,
						maxPointsPerVote: 100,
						minPointsPerVote: 101
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"minPointsPerVote" must be less than or equal to ref:pointsPerDay')
						res.body.validation.keys.should.contain('minPointsPerVote')
					})

				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						pointsPerDay: 100,
						maxPointsPerVote: 100,
						minPointsPerVote: 0
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"minPointsPerVote" must be larger than or equal to 1')
						res.body.validation.keys.should.contain('minPointsPerVote')
					})
			})

			it('fails if voteEndingTime is greater than lunchTime', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						voteEndingTime: '12:30:01'
					})
					.expect(400)
					.expect(Boom.badRequest('"lunchTime" must be greater than voteEndingTime').output.payload)
			})

			it('fails if utcOffset is greater than 720', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						utcOffset: 721
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.include('"utcOffset" must be less than or equal to 720')
						res.body.validation.keys.should.contain('utcOffset')
					})
			})

			it('fails if utcOffset is less than -720', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						utcOffset: -721
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.include('"utcOffset" must be larger than or equal to -720')
						res.body.validation.keys.should.contain('utcOffset')
					})
			})

			it('fails if utcOffset is not a multiple of 60', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...newGroup,
						utcOffset: 61
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.include('"utcOffset" must be a multiple of 60')
						res.body.validation.keys.should.contain('utcOffset')
					})
			})

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
						member.should.have
							.property('config')
							.which.has.property('isAdmin')
							.equal(true)
						member.should.have
							.property('config')
							.which.has.property('color')
							.equal('#80d8ff')
					})
			})
		})
	})

	describe('/groups/:groupId', () => {
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

			it("sends 403 if user isn't a group member", async () => {
				await request
					.get('/groups/2')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})
		})

		describe('PUT', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			const updatedGroup = {
				name: 'New name',
				lunchTime: '14:00:00',
				voteEndingTime: '13:30:00',
				utcOffset: -120,
				pointsPerDay: 300,
				maxPointsPerVote: 100,
				minPointsPerVote: 50
			}

			it('fails with 403 if the user is no group admin', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(updatedGroup)
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('fails if required values are missing', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({})
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message:
							'"name" is required. "lunchTime" is required. "voteEndingTime" is required. "utcOffset" is required. "pointsPerDay" is required. "minPointsPerVote" is required. "maxPointsPerVote" is required',
						validation: {
							source: 'payload',
							keys: [
								'name',
								'lunchTime',
								'voteEndingTime',
								'utcOffset',
								'pointsPerDay',
								'minPointsPerVote',
								'maxPointsPerVote'
							]
						}
					})
			})

			it('fails if pointsPerDay is not a number between 1 and 1000', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						pointsPerDay: 0
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"pointsPerDay" must be larger than or equal to 1')
						res.body.validation.keys.should.contain('pointsPerDay')
					})

				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						pointsPerDay: 1001
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"pointsPerDay" must be less than or equal to 1000')
						res.body.validation.keys.should.contain('pointsPerDay')
					})
			})

			it('fails if maxPointsPerVote not a number between minPointsPerVote and pointsPerDay', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						pointsPerDay: 99,
						maxPointsPerVote: 100,
						minPointsPerVote: 10
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"maxPointsPerVote" must be less than or equal to ref:pointsPerDay')
						res.body.validation.keys.should.contain('maxPointsPerVote')
					})

				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						pointsPerDay: 100,
						maxPointsPerVote: 9,
						minPointsPerVote: 10
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"maxPointsPerVote" must be larger than or equal to ref:minPointsPerVote')
						res.body.validation.keys.should.contain('maxPointsPerVote')
					})
			})

			it('fails if minPointsPerVote is not a number between 1 and pointsPerDay', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						pointsPerDay: 100,
						maxPointsPerVote: 100,
						minPointsPerVote: 101
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"minPointsPerVote" must be less than or equal to ref:pointsPerDay')
						res.body.validation.keys.should.contain('minPointsPerVote')
					})

				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						pointsPerDay: 100,
						maxPointsPerVote: 100,
						minPointsPerVote: 0
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.contain('"minPointsPerVote" must be larger than or equal to 1')
						res.body.validation.keys.should.contain('minPointsPerVote')
					})
			})

			it('fails if voteEndingTime is greater than lunchTime', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						voteEndingTime: '14:00:01' // lunchTime is 14:00:00
					})
					.expect(400)
					.expect(Boom.badRequest('"lunchTime" must be greater than voteEndingTime').output.payload)
			})

			it('fails if utcOffset is greater than 720', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						utcOffset: 721
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.include('"utcOffset" must be less than or equal to 720')
						res.body.validation.keys.should.contain('utcOffset')
					})
			})

			it('fails if utcOffset is less than -720', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						utcOffset: -721
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.include('"utcOffset" must be larger than or equal to -720')
						res.body.validation.keys.should.contain('utcOffset')
					})
			})

			it('fails if utcOffset is not a multiple of 60', async () => {
				await request
					.post('/groups')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						...updatedGroup,
						utcOffset: 61
					})
					.expect(400)
					.expect(res => {
						res.body.message.should.include('"utcOffset" must be a multiple of 60')
						res.body.validation.keys.should.contain('utcOffset')
					})
			})

			it('updates a group successfully', async () => {
				await request
					.put('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(updatedGroup)
					.expect(200)
					.expect(res => {
						const group = res.body
						group.should.have.all.keys(testData.getGroupKeys())
						Object.keys(updatedGroup).forEach(key => group[key].should.be.eql(updatedGroup[key]))
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
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('deletes a group successfully', async () => {
				await request
					.delete('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(403)
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
							if (res.body.find(group => group.id === 1)) {
								throw new Error('User is still a member of group 1')
							}
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
