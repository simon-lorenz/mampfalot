const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const testServer = require('../utils/test-server')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')

describe('Participation', () => {
	describe('/users/me/participations', () => {
		describe('GET', () => {
			it('requires from and to query values', async () => {
				await request
					.get('/users/me/participations/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						errorHelper.checkRequiredQueryValues(res.body, ['from', 'to'], true)
					})
			})

			it('fails if from is greater or equal than to', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The given timespan is invalid.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})

				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-02', to: '2018-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The given timespan is invalid.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})
			})

			it('fails if from and to are not in the same year', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-12-31', to: '2019-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The query values from and to have to be in the same year.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})
			})

			it('from and to should be inclusive')

			it('sends a correct collection of participations', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-12-31' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.should.be.deep.equal(testData.getParticipationsOf('maxmustermann', 1))
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
					amountSpent: 12
				}

				testServer.start(5001, '11:24:59', '01.07.2018')
				await setupDatabase()
			})

			it('requires body values votes, result and amountSpent', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.then(res => {
						errorHelper.checkRequiredBodyValues(res.body, ['amountSpent', 'result', 'votes'], true)
					})
			})

			it('fails if user is no group member', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.send(payload)
					.expect(403)
					.expect(res => {
						const expectedError = {
							resoucre: 'Participation',
							value: null,
							operation: 'CREATE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails if voteEndingTime is reached', async () => {
				testServer.start(5001, '11:25:01', '01.07.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const message = 'The end of voting is reached, therefore you cannot create a new lunchbreak.'
						errorHelper.checkRequestError(res.body, message)
					})

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(404)
			})

			it('does not delete older votes if voteEndingTime is reached', async () => {
				testServer.start(5001, '11:24:59', '01.07.2018')

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

				testServer.start(5001, '11:25:01', '01.07.2018')

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
				testServer.start(5001, '11:24:00', '01.07.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-06-30/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const message = 'Participations can only be created for today.'
						errorHelper.checkRequestError(res.body, message)
					})

				await request
					.get('/groups/1/lunchbreaks/2018-06-30')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(404)
			})

			it('fails if the date lies in the future', async () => {
				testServer.start(5001, '11:24:00', '01.07.2018')
				await request
					.post('/groups/1/lunchbreaks/2018-07-02/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const message = 'Participations can only be created for today.'
						errorHelper.checkRequestError(res.body, message)
					})

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
					.expect(res => {
						const expected = {
							field: 'resultId',
							value: payload.result.id,
							message: 'This place does not belong to the associated group.'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if not all votes have a place specified', async () => {
				payload.votes.push({ points: 30 })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'placeId',
							value: null,
							message: 'placeId cannot be null.'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if not all votes have points specified', async () => {
				payload.votes.push({ place: testData.getPlace(2) })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'points',
							value: null,
							message: 'Points cannot be null.'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if two votes share the same place name', async () => {
				payload.votes.push({ points: 30, place: testData.getPlace(1) })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'placeId',
							value: payload.votes[0].place.id,
							message: 'Votes must have different places.'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if at least one vote has more points than maxPointsPerVote', async () => {
				payload.votes[0].points = 71

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'points',
							value: payload.votes[0].points,
							message: 'Points exceeds maxPointsPerVote (70).'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if at least one vote has less points than minPointsPerVote', async () => {
				payload.votes[0].points = 29

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'points',
							value: payload.votes[0].points,
							message: 'Points deceeds minPointsPerVote (30).'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if at least one vote contains a place name, that does not exist for this group', async () => {
				payload.votes.push({ points: 30, place: testData.getPlace(5) })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'placeId',
							value: payload.votes[1].place.id,
							message: 'This placeId does not belong to the associated group.'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if the sum of points is greater than pointsPerDay', async () => {
				payload.votes.push({ points: 70, place: testData.getPlace(2) })

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'points',
							value: payload.votes[0].points + payload.votes[1].points,
							message: 'Sum of points exceeds pointsPerDay (100).'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if points are not a number', async () => {
				payload.votes[0].points = 'abc'

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'points',
							value: payload.votes[0].points,
							message: 'Points must be an integer.'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('fails if points are float', async () => {
				payload.votes[0].points = 30.5

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/participation')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(payload)
					.expect(400)
					.expect(res => {
						const expected = {
							field: 'points',
							value: payload.votes[0].points,
							message: 'Points must be an integer.'
						}
						errorHelper.checkValidationError(res.body, expected)
					})
			})

			it('overrides a previous participation', async () => {
				testServer.start(5001, '11:24:59', '25.06.2018')

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
				await testServer.start(5001, '11:24:59', '26.06.2018')

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
				await testServer.start(5001, '11:24:59', '26.06.2018')
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
				testServer.start(5001, '11:24:59', '25.06.2018')
				await setupDatabase()
			})

			it('returns 404s', async () => {
				testServer.start(5001, '11:24:59', '01.07.2018')
				await request
					.put('/groups/1/lunchbreaks/2018-07-01/participation')
					.send({
						votes: []
					})
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('requires at least one paramter of votes, result and amountSpent', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						errorHelper.checkRequiredBodyValues(res.body, ['amountSpent', 'result', 'votes'])
					})
			})

			it('allows null for result and amountSpent', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
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
				testServer.start(5001, '11:24:59', '26.06.2018')
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
						votes: newVotes
					})
					.expect(200)
					.expect(res => {
						const participation = res.body
						participation.votes.should.be.deep.eql(votes)
					})
			})

			it('ignores new votes if the voteEndingTime is reached', async () => {
				testServer.start(5001, '11:25:01', '25.06.2018')
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
						votes: newVotes
					})
					.expect(200)
					.expect(res => {
						const participation = res.body
						participation.votes.should.be.deep.eql(votes)
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
				testServer.start(5001, '11:25:01', '26.06.2018')

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
				testServer.start(5001, '11:24:59', '25.06.2018')
				await setupDatabase()
			})

			it('fails if the voteEndingTime is reached', async () => {
				testServer.start(5001, '11:25:01', '25.06.2018')
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const MESSAGE = 'The end of voting has been reached, therefore this participation cannot be deleted.'
						errorHelper.checkRequestError(res.body, MESSAGE)
					})
			})

			it('fails if the participation lies in the past', async () => {
				testServer.start(5001, '11:24:59', '26.06.2018')
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const MESSAGE = 'The end of voting has been reached, therefore this participation cannot be deleted.'
						errorHelper.checkRequestError(res.body, MESSAGE)
					})
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
				testServer.start(5001, '11:24:59', '01.07.2018')

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
						lunchbreak.should.have
							.property('absent')
							.which.is.an('array')
							.with.lengthOf(1)
						lunchbreak.should.have
							.property('participants')
							.which.is.an('array')
							.with.lengthOf(0)
					})
			})

			it('does not delete the associated lunchbreak if other comments exist', async () => {
				await testServer.start(5001, '11:24:59', '01.07.2018')

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
				await testServer.start(5001, '11:24:59', '01.07.2018')

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
