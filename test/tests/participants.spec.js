const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const testServer = require('../utils/test-server')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')

describe('/participants', () => {
	describe('/:participantId', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('fails if user is no group member', async () => {
				await request
					.get('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Participant',
							id: 1,
							operation: 'READ'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('returns NotFoundError', async () => {
				await request
					.get('/participants/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Participant', 99)
					})
			})

			it('succeeds if user is group member', async () => {
				await request
					.get('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
			})

			it('sends a valid participant resource', async () => {
				await request
					.get('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const participant = res.body
						participant.should.have.property('id').equal(1)
						participant.should.have.property('user')
						participant.should.have.property('votes')
						const firstVote = participant.votes[0]
						firstVote.should.have.property('place')
						participant.should.have.property('lunchbreakId').equal(1)
						participant.should.have.property('userId').equal(1)
						participant.should.not.have.property('amountSpent')
					})
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				testServer.start(5001, '11:24:59', '25.06.2018')
				await setupDatabase()
			})

			it('fails if user is not the participant', async () => {
				await request
					.delete('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Participant',
							id: 1,
							operation: 'DELETE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails if the voteEndingTime is reached', async () => {
				testServer.start(5001, '12:25:01', '25.06.2018')
				await request
					.delete('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const MESSAGE = 'The end of voting has been reached, therefore this participant cannot be deleted.'
						errorHelper.checkRequestError(res.body, MESSAGE)
					})
			})

			it('deletes a participant successfully', async () => {
				await request
					.delete('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('deletes all votes associated to this participant', async () => {
				await request
					.delete('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)

				await request
					.get('/votes/2')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('does not delete the associated lunchbreak', async () => {
				await request
					.delete('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/lunchbreaks/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('does not delete the associated user', async () => {
				await request
					.delete('/participants/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('deletes associated lunchbreak if no participants left', async () => {
				await request
					.delete('/participants/3')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request
					.get('/lunchbreaks/2')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(404)
			})

		})

		describe('/votes', () => {
			describe('GET', () => {
				before(async () => {
					await setupDatabase()
				})

				it('sends a list of votes', async () => {
					await request
						.get('/participants/1/votes')
						.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
						.expect(200)
						.expect(res => {
							const votes = res.body
							votes.should.be.an('array').which.has.a.lengthOf(3)

							const firstVote = votes[0]
							firstVote.should.have.property('id').equal(1)
							firstVote.should.have.property('participantId').equal(1)
							firstVote.should.have.property('placeId').equal(2)
							firstVote.should.have.property('points').equal(30)
						})
				})
			})
		})
	})
})
