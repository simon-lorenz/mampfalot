const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const testServer = require('../utils/test-server')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')

describe('/votes', () => {
	describe('POST', () => {
		let newVotes

		beforeEach(async () => {
			testServer.start(5001, '11:24:59', '25.06.2018') // UTC-Time! Group_1 has an offset of +60 Minutes.
			newVotes = [
				{
					participantId: 1,
					placeId: 1,
					points: 40
				},
				{
					participantId: 1,
					placeId: 2,
					points: 60
				}
			]
			await setupDatabase()
		})

		it('fails if no body values are provided', async () => {
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.expect(400)
				.expect(res => {
					errorHelper.checkRequestError(res.body)
				})
		})

		it('fails if body contains an empty array', async () => {
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send([])
				.expect(400)
				.expect(res => {
					errorHelper.checkRequestError(res.body)
				})
		})

		it('fails if participant.userId does not match the users id', async () => {
			newVotes[0].participantId = 2
			newVotes[1].participantId = 2
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'participantId',
						value: 2,
						message: 'This participantId is not associated to your userId.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if participantId does not exist', async () => {
			newVotes[0].participantId = 99
			newVotes[1].participantId = 99
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'participantId',
						value: 99,
						message: 'This participantId is not associated to your userId.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if placeId does not exist', async () => {
			newVotes[0].placeId = 99
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'placeId',
						value: 99,
						message: 'This placeId does not belong to the associated group.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if place id does not belong to group', async () => {
			newVotes[0].placeId = 5
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'placeId',
						value: 5,
						message: 'This placeId does not belong to the associated group.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if sum of points is greater than pointsPerDay', async () => {
			newVotes[0].points = 60
			newVotes[1].points = 60
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'points',
						value: 120,
						message: 'Sum of points exceeds pointsPerDay (100).'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if points is greater than maxPointsPerVote', async () => {
			newVotes[0].points = 101
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'points',
						value: 101,
						message: 'Points exceeds maxPointsPerVote (70).'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if points is lesser than minPointsPerVote', async () => {
			newVotes[0].points = 29
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'points',
						value: 29,
						message: 'Points deceeds minPointsPerVote (30).'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if parameter participantId is missing', async () => {
			newVotes[0].participantId = undefined
			newVotes[1].participantId = undefined
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'participantId',
						value: null,
						message: 'participantId cannot be null.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if parameter placeId is missing', async () => {
			newVotes[1].placeId = undefined
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'placeId',
						value: null,
						message: 'placeId cannot be null.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if parameter points is missing', async () => {
			newVotes[1].points = undefined
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'points',
						value: null,
						message: 'Points cannot be null.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if parameter points is not a numner', async () => {
			newVotes[1].points = 'Not a number'
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'points',
						value: 'Not a number',
						message: 'Points has to be numeric.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if the participantId isn\'t the same in all votes', async () => {
			newVotes[1].participantId = 3
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'participantId',
						value: 'Various values',
						message: 'The participantId has to be the same in all votes.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if two or more votes have the same placeId', async () => {
			newVotes[0].placeId = 1
			newVotes[1].placeId = 1
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'placeId',
						value: 1,
						message: 'Two votes had the same placeId.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('fails if the groups voteEndingTime is reached', async () => {
			testServer.start(5001, '11:25:01', '25.06.2018') // UTC-Time! Group_1 has an offset of +60 Minutes.

			const oldVotes = await request
				.get('/participants/1/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.then(res => res.body)

			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send([{
					participantId: 1,
					placeId: 1,
					points: 40
				}])
				.expect(400)
				.expect(res => {
					const MESSAGE = 'The end of voting has been reached, therefore no new votes will be accepted.'
					errorHelper.checkRequestError(res.body, MESSAGE)
				})

			// Are the votes still the same as before?
			await request
				.get('/participants/1/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.expect(res => res.body.should.be.eql(oldVotes))
		})

		it('fails if the voteEndingTime isn\'t reached, but the lunchbreak is in the past', async () => {
			testServer.start(5001, '11:24:59', '26.06.2018')
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send([{
					participantId: 1,
					placeId: 1,
					points: 40
				}])
				.expect(400)
				.expect(res => {
					const MESSAGE = 'The end of voting has been reached, therefore no new votes will be accepted.'
					errorHelper.checkRequestError(res.body, MESSAGE)
				})
		})

		it('accepts point value as string', async () => {
			newVotes[0].points = '30'
			newVotes[1].points = '70'
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(200)
				.expect(res => {
					const votes = res.body
					votes.should.be.an('array').with.length(2)

					const firstVote = votes[0]
					firstVote.should.have.property('id')
					firstVote.should.have.property('participantId').equal(1)
					firstVote.should.have.property('placeId').equal(1)
					firstVote.should.have.property('points').equal(30)
					firstVote.should.have.property('place').which.is.an('object')
				})
		})

		it('successfully adds a single vote', async () => {
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send([{
					participantId: 1,
					placeId: 1,
					points: 40
				}])
				.expect(200)
				.expect(res => {
					const votes = res.body
					votes.should.be.an('array').with.length(1)

					const vote = votes[0]
					vote.should.have.property('id')
					vote.should.have.property('participantId').equal(1)
					vote.should.have.property('placeId').equal(1)
					vote.should.have.property('place').which.is.an('object')
					vote.should.have.property('points').equal(40)
				})
		})

		it('successfully adds a bunch of votes', async () => {
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newVotes)
				.expect(200)
				.expect(res => {
					const votes = res.body
					votes.should.be.an('array').with.length(2)

					const firstVote = votes[0]
					firstVote.should.have.property('id')
					firstVote.should.have.property('participantId').equal(1)
					firstVote.should.have.property('placeId').equal(1)
					firstVote.should.have.property('points').equal(40)
					firstVote.should.have.property('place').which.is.an('object')

				})
		})

		it('works correctly for participants of different groups', async () => {
			newVotes[0].participantId = 3
			newVotes[0].points = 6
			newVotes[0].placeId = 5
			newVotes.pop()
			await request
				.post('/votes')
				.set(await TokenHelper.getAuthorizationHeader('loten'))
				.send(newVotes)
				.expect(200)
		})
	})

	describe('/:voteId', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('fails if user is not the participant linked to the vote', async () => {
				await request
					.get('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Vote',
							id: 1,
							operation: 'READ'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails with 404 if vote does not exist', async () => {
				await request
					.get('/votes/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Vote', 99)
					})
			})

			it('sends a correct vote resource', async () => {
				await request
					.get('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const vote = res.body
						vote.should.have.property('id').equal(1)
						vote.should.have.property('participantId').equal(1)
						vote.should.have.property('placeId').equal(2)
						vote.should.have.property('place').which.is.an('object')
						vote.should.have.property('points').equal(30)
					})
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await testServer.start(5001, '11:24:59', '25.06.2018') // UTC-Time! Group_1 has an offset of +60 Minutes.
				await setupDatabase()
			})

			it('fails if user is not the participant linked to the vote', async () => {
				await request
					.delete('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Vote',
							id: 1,
							operation: 'DELETE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails with 404 if vote does not exist', async () => {
				await request
					.delete('/votes/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Vote', 99)
					})
			})

			it('deletes a vote successfully', async () => {
				await request
					.delete('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('does not delete the associated place', async () => {
				await request
					.delete('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/places/2')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('does not delete the associated participant', async () => {
				await request
					.delete('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})
		})
	})
})
