const Boom = require('@hapi/boom')
const supertest = require('supertest')

const testServer = require('../../test/utils/test-server')
const TokenHelper = require('../../test/utils/token-helper')
const testData = require('../knex/seeds')

const request = supertest('http://localhost:5001')

describe('Participation', () => {
	describe('/users/me/participations', () => {
		describe('GET', () => {
			it('requires from and to query values', async () => {
				await request
					.get('/users/me/participations/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"from" is required. "to" is required',
						validation: {
							source: 'query',
							keys: ['from', 'to']
						}
					})
			})

			it('fails if from is greater or equal than to', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(Boom.badRequest('The given timespan is invalid').output.payload)

				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-02', to: '2018-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(Boom.badRequest('The given timespan is invalid').output.payload)
			})

			it('fails if from and to are not in the same year', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-12-31', to: '2019-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(Boom.badRequest('The query values from and to have to be in the same year').output.payload)
			})

			it('from and to should be inclusive')

			it('works if result is null', async () => {
				await request
					.delete('/groups/1/places/4')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-12-31' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body[0].should.have.property('result').eql(null)
					})
			})

			it('sends a correct collection of participations', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-12-31' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.should.be.deep.equalInAnyOrder(testData.getParticipationsOf('maxmustermann', 1))
					})

				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-01-02' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.should.be.deep.equal([])
					})
			})
		})
	})

	describe('/groups/:groupId/lunchbreaks/:date/participation', () => {
		describe('POST', () => {
			let payload

			beforeEach(async () => {
				payload = {
					votes: [
						{
							points: 70,
							place: testData.getPlace(1)
						}
					],
					result: testData.getPlace(2),
					amountSpent: 12.5
				}

				await testServer.start('11:24:59', '01.07.2018')
			})

			it('requires body values votes, result and amountSpent', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({})
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"amountSpent" is required. "votes" is required. "result" is required',
						validation: {
							source: 'payload',
							keys: ['amountSpent', 'votes', 'result']
						}
					})
			})

			it('fails if user is no group member', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.send(payload)
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)

				await testServer.start('11:24:59', '26.02.2020')
				await request
					.post('/groups/1/lunchbreaks/2020-02-26/participation')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.send(payload)
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('fails if voteEndingTime is reached and a participation exists already', async () => {
				await testServer.start('11:24:59', '01.07.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(201)

				await testServer.start('11:25:01', '01.07.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting has been reached, therefore you cannot create a new participation')
							.output.payload
					)
			})

			it('fails if voteEndingTime is reached and no lunchbreak exists yet', async () => {
				await testServer.start('11:25:01', '01.07.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting is reached, therefore you cannot create a new lunchbreak.').output
							.payload
					)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(404)
			})

			it('does not delete older votes if voteEndingTime is reached', async () => {
				await testServer.start('11:24:59', '01.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(201)

				const votes = await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.then(res => {
						const participant = res.body.participants.find(p => p.member.username === 'johndoe1')
						return participant.votes
					})

				await testServer.start('11:25:01', '01.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send({ amountSpent: null, result: null, votes: [] })
					.expect(400)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.then(res => {
						const participant = res.body.participants.find(p => p.member.username === 'johndoe1')
						participant.votes.should.be.deep.eql(votes)
					})
			})

			it('fails if the date lies in the past', async () => {
				await testServer.start('11:24:00', '01.07.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-06-30/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(Boom.badRequest('Participations can only be created for today').output.payload)

				await request
					.get('/groups/1/lunchbreaks/2018-06-30')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(404)
			})

			it('fails if the date lies in the future', async () => {
				await testServer.start('11:24:00', '01.07.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-07-02/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(Boom.badRequest('Participations can only be created for today').output.payload)

				await request
					.get('/groups/1/lunchbreaks/2018-07-02')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(404)
			})

			it('accepts null for result and amountSpent', async () => {
				payload.result = null
				payload.amountSpent = null
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(201)
					.expect(res => {
						const participation = res.body
						participation.should.have.property('result').which.is.eql(null)
						participation.should.have.property('amountSpent').which.is.eql(null)
					})
			})

			it('accepts a empty array of votes', async () => {
				payload.votes = []
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(201)
					.expect(res => {
						const participation = res.body
						participation.votes.should.be.eql([])
					})
			})

			it('fails if the result place id does not belong to the group', async () => {
				payload.result = testData.getPlace(5)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(
						Boom.badRequest('The results placeId does not exists or does not belong to this group').output.payload
					)
			})

			it('fails if not all votes have a place specified', async () => {
				payload.votes.push({ points: 30 })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"votes[1].place" is required',
						validation: { source: 'payload', keys: ['votes.1.place'] }
					})
			})

			it('fails if not all votes have points specified', async () => {
				payload.votes.push({ place: testData.getPlace(2) })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"votes[1].points" is required',
						validation: { source: 'payload', keys: ['votes.1.points'] }
					})
			})

			it('fails if two votes share the same place id', async () => {
				payload.votes.push({ points: 30, place: testData.getPlace(1) })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"votes[1]" contains a duplicate value',
						validation: { source: 'payload', keys: ['votes.1'] }
					})
			})

			it('fails if at least one vote has more points than maxPointsPerVote', async () => {
				payload.votes[0].points = 71

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(Boom.badRequest(`Points is greater than maxPointsPerVote (70)`).output.payload)
			})

			it('fails if at least one vote has less points than minPointsPerVote', async () => {
				payload.votes[0].points = 29

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(Boom.badRequest(`Points is less than minPointsPerVote (30)`).output.payload)
			})

			it('fails if at least one vote contains a place id, that does not exist for this group', async () => {
				payload.votes.push({ points: 30, place: testData.getPlace(5) })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(
						Boom.badRequest(`At least one vote contains a place that is not associated with the group`).output.payload
					)
			})

			it('fails if the sum of points is greater than pointsPerDay', async () => {
				payload.votes.push({ points: 70, place: testData.getPlace(2) })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(Boom.badRequest(`Sum of points exceeds pointsPerDay (100)`).output.payload)
			})

			it('fails if points are not a number', async () => {
				payload.votes[0].points = 'abc'

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"votes[0].points" must be a number',
						validation: { source: 'payload', keys: ['votes.0.points'] }
					})
			})

			it('fails if points are float', async () => {
				payload.votes[0].points = 30.5

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"votes[0].points" must be an integer',
						validation: { source: 'payload', keys: ['votes.0.points'] }
					})
			})

			it('overrides a previous participation', async () => {
				await testServer.start('11:24:59', '25.06.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(payload)
					.expect(201)
					.expect(res => {
						const participation = res.body
						participation.should.have.all.keys(testData.getParticipationKeys())
						participation.result.should.be.deep.eql(testData.getPlace(payload.result.id))
						participation.amountSpent.should.be.eql(payload.amountSpent)
						participation.votes.should.be.deep.eql(payload.votes)
					})

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const participants = res.body.participants
						if (participants.find(participant => participant.member.username === 'johndoe1') === undefined) {
							throw new Error('The participation was not created.')
						}
					})
			})

			it('removes an absence', async () => {
				await testServer.start('11:24:59', '26.06.2018')

				await request
					.get('/groups/1/lunchbreaks/2018-06-26')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const absent = res.body.absent
						if (absent.find(member => member.username === 'maxmustermann') === undefined) {
							throw new Error('No absence found to delete!')
						}
					})

				await request
					.post('/groups/1/lunchbreaks/2018-06-26/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(payload)

				await request
					.get('/groups/1/lunchbreaks/2018-06-26')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const absent = res.body.absent
						if (absent.find(member => member.username === 'maxmustermann')) {
							throw new Error('The absence was not deleted.')
						}
					})
			})

			it('successfully creates a participation with lunchbreak existing', async () => {
				await testServer.start('11:24:59', '26.06.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-06-26/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(201)
					.expect(res => {
						const participation = res.body
						participation.should.have.all.keys(testData.getParticipationKeys())
						participation.result.should.be.deep.eql(testData.getPlace(payload.result.id))
						participation.amountSpent.should.be.eql(payload.amountSpent)
					})

				await request
					.get('/groups/1/lunchbreaks/2018-06-26')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						const participants = res.body.participants
						if (participants.find(participant => participant.member.username === 'johndoe1') === undefined) {
							throw new Error('The participation was not created.')
						}
					})
			})

			it('successfully creates a participation without lunchbreak existing', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(201)
					.expect(res => {
						const participation = res.body
						participation.should.have.all.keys(testData.getParticipationKeys())
						participation.result.should.be.deep.eql(testData.getPlace(payload.result.id))
						participation.amountSpent.should.be.eql(payload.amountSpent)
					})

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						const participants = res.body.participants
						if (participants.find(participant => participant.member.username === 'johndoe1') === undefined) {
							throw new Error('The participation was not created.')
						}
					})
			})
		})

		describe('PUT', () => {
			beforeEach(async () => {
				await testServer.start('11:24:59', '25.06.2018')
			})

			it('requires result and amountSpent', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({})
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"amountSpent" is required. "result" is required',
						validation: {
							source: 'payload',
							keys: ['amountSpent', 'result']
						}
					})
			})

			it('allows null for result and amountSpent', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						votes: [],
						amountSpent: null,
						result: null
					})
					.expect(200)
					.expect(res => {
						const participation = res.body
						participation.should.have.property('result').eql(null)
						participation.should.have.property('amountSpent').eql(null)
					})
			})

			it('ignores new votes if the participation lies in the past', async () => {
				await testServer.start('11:24:59', '26.06.2018')
				const newVotes = []

				const votes = await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => {
						const lunchbreak = res.body
						return lunchbreak.participants.find(p => p.member.username === 'maxmustermann')
					})
					.then(participation => participation.votes)

				votes.should.not.be.deep.eql(newVotes)

				await request
					.put('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						votes: newVotes,
						amountSpent: null,
						result: null
					})
					.expect(200)
					.expect(res => {
						const participation = res.body
						participation.votes.should.be.deep.equalInAnyOrder(votes)
					})
			})

			it('ignores new votes if the voteEndingTime is reached', async () => {
				await testServer.start('11:25:01', '25.06.2018')
				const newVotes = []

				const votes = await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => {
						const lunchbreak = res.body
						return lunchbreak.participants.find(p => p.member.username === 'maxmustermann')
					})
					.then(participation => participation.votes)

				votes.should.not.be.deep.eql(newVotes)

				await request
					.put('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						votes: newVotes,
						amountSpent: null,
						result: null
					})
					.expect(200)
					.expect(res => {
						const participation = res.body
						participation.votes.should.be.deep.equalInAnyOrder(votes)
					})
			})

			it('successfully updates todays participation', async () => {
				const payload = {
					votes: [
						{
							points: 45,
							place: testData.getPlace(1)
						},
						{
							points: 55,
							place: testData.getPlace(2)
						}
					],
					result: testData.getPlace(2),
					amountSpent: 99.4
				}

				await request
					.put('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(payload)
					.expect(200)
					.expect(res => {
						res.body.should.have.all.keys(testData.getParticipationKeys())
						res.body.should.have.property('date').deep.eql('2018-06-25')
						res.body.should.have.property('votes').deep.eql(payload.votes)
						res.body.should.have.property('amountSpent').deep.eql(payload.amountSpent)
						res.body.should.have.property('result').deep.eql(payload.result)
					})
			})

			it('successfully updates result and amountSpent of a participation in the past', async () => {
				await testServer.start('11:25:01', '26.06.2018')

				const payload = {
					result: testData.getPlace(2),
					amountSpent: 99.4
				}

				await request
					.put('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(payload)
					.expect(200)
					.expect(res => {
						const participation = res.body
						participation.result.should.be.deep.eql(payload.result)
						participation.amountSpent.should.be.deep.eql(payload.amountSpent)
					})
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await testServer.start('11:24:59', '25.06.2018')
			})

			it('fails if the voteEndingTime is reached', async () => {
				await testServer.start('11:25:01', '25.06.2018')
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting has been reached, therefore this participation cannot be deleted').output
							.payload
					)
			})

			it('fails if the participation lies in the past', async () => {
				await testServer.start('11:24:59', '26.06.2018')
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting has been reached, therefore this participation cannot be deleted').output
							.payload
					)
			})

			it('deletes a participant successfully', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => {
						const lunchbreak = res.body
						const max = lunchbreak.participants.find(participant => {
							participant.member.username === 'maxmustermann'
						})

						if (max) {
							throw new Error('The participation was not deleted.')
						}
					})
			})

			it('does not delete the associated lunchbreak if other participants exist', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.participants.should.be.an('array').with.lengthOf(2)
					})

				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.participants.should.be.an('array').with.lengthOf(1)
					})
			})

			it('does not delete the associated lunchbreak if other absences exist', async () => {
				await testServer.start('11:24:59', '01.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						votes: [],
						result: null,
						amountSpent: null
					})
					.expect(201)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(201)

				await request
					.delete('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const lunchbreak = res.body
						lunchbreak.should.have.property('absent').which.is.an('array').with.lengthOf(1)
						lunchbreak.should.have.property('participants').which.is.an('array').with.lengthOf(0)
					})
			})

			it('does not delete the associated lunchbreak if other comments exist', async () => {
				await testServer.start('11:24:59', '01.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						votes: [],
						result: null,
						amountSpent: null
					})
					.expect(201)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: "Don't delete me!"
					})
					.expect(201)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)

				await request
					.delete('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.participants.should.be.deep.eql([])
						res.body.comments.should.be.an('array').with.lengthOf(1)
					})
			})

			it('does delete the associated lunchbreak if no other participants, absences or comments exist', async () => {
				await testServer.start('11:24:59', '01.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						votes: [],
						result: null,
						amountSpent: null
					})
					.expect(201)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)

				await request
					.delete('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('does not delete the associated user', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})
		})
	})
})
