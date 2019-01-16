'use strict'

const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/participants', () => {
		describe('/:participantId', () => {
			describe('GET', () => {
				before(async () => {
					await setup.resetData()
				})

				it('fails if user is no group member', (done) => {
					request
						.get('/participants/1')
						.set({ Authorization: bearerToken[3] })
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'Participant',
								id: 1,
								operation: 'READ'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('returns NotFoundError', (done) => {
					request
						.get('/participants/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Participant', 99)
						})
						.end(done)
				})

				it('succeeds if user is group member', (done) => {
					request
						.get('/participants/1')
						.set({ Authorization: bearerToken[2] })
						.expect(200, done)
				})

				it('sends a valid participant resource', (done) => {
					request
						.get('/participants/1')
						.set({ Authorization: bearerToken[1] })
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
							participant.should.have.property('lunchTimeSuggestion')
							participant.should.not.have.property('amountSpent')
						})
						.end(done)
				})
			})

			describe('DELETE', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('fails if user is not the participant', (done) => {
					request
						.delete('/participants/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'Participant',
								id: 1,
								operation: 'DELETE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('deletes a participant successfully', async () => {
					await request
						.delete('/participants/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/participants/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})

				it('deletes all votes associated to this participant', async () => {
					await request
						.delete('/participants/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/votes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)

					await request
						.get('/votes/2')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})

				it('does not delete the associated lunchbreak', async () => {
					await request
						.delete('/participants/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/lunchbreaks/1')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
				})

				it('does not delete the associated user', async () => {
					await request
						.delete('/participants/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/users/1')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
				})
			})

			describe('/votes', () => {
				describe('GET', () => {
					before(async () => {
						await setup.resetData()
					})

					it('sends a list of votes', (done) => {
						request
							.get('/participants/1/votes')
							.set({ Authorization: bearerToken[1] })
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
							.end(done)
					})
				})
			})
		})
	})
}
