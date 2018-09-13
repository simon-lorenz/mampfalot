const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/votes', () => {
		describe('POST', () => {
			let newVotes

			beforeEach(async () => {
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
				await setup.resetData()
			})

			it('fails if no body values are provided', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body)
					})
					.end(done)
			})

			it('fails if body contains an empty array', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send([])
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body)
					})
					.end(done)
			})

			it('fails if participant.userId does not match the users id', (done) => {
				newVotes[0].participantId = 2
				newVotes[1].participantId = 2
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'participantId',
							value: 2,
							message: 'This participantId is not associated to your userId.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if participantId does not exist', (done) => {
				newVotes[0].participantId = 99
				newVotes[1].participantId = 99
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'participantId',
							value: 99,
							message: 'This participantId is not associated to your userId.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if placeId does not exist', (done) => {
				newVotes[0].placeId = 99
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'placeId',
							value: 99,
							message: 'This placeId does not belong to the associated group.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if place id does not belong to group', (done) => {
				newVotes[0].placeId = 5
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'placeId',
							value: 5,
							message: 'This placeId does not belong to the associated group.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if sum of points is greater than pointsPerDay', (done) => {
				newVotes[0].points = 60
				newVotes[1].points = 60
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'points',
							value: 120,
							message: 'Sum of points exceeds pointsPerDay (100).'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if points is greater than maxPointsPerVote', (done) => {
				newVotes[0].points = 101
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'points',
							value: 101,
							message: 'Points exceeds maxPointsPerVote (70).'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if points is lesser than minPointsPerVote', (done) => {
				newVotes[0].points = 29
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'points',
							value: 29,
							message: 'Points deceeds minPointsPerVote (30).'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if parameter participantId is missing', (done) => {
				newVotes[0].participantId = undefined
				newVotes[1].participantId = undefined
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'participantId',
							value: null,
							message: 'participantId cannot be null.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if parameter placeId is missing', (done) => {
				newVotes[1].placeId = undefined
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'placeId',
							value: null,
							message: 'placeId cannot be null.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if parameter points is missing', (done) => {
				newVotes[1].points = undefined
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'points',
							value: null,
							message: 'Points cannot be null.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if parameter points is not a numner', (done) => {
				newVotes[1].points = 'Not a number'
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'points',
							value: 'Not a number',
							message: 'Points has to be numeric.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if the participantId isn\'t the same in all votes', (done) => {
				newVotes[1].participantId = 3
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'participantId',
							value: 'Various values',
							message: 'The participantId has to be the same in all votes.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if two or more votes have the same placeId', (done) => {
				newVotes[0].placeId = 1
				newVotes[1].placeId = 1
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'placeId',
							value: 1,
							message: 'Two votes had the same placeId.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('accepts point value as string', (done) => {
				newVotes[0].points = '30'
				newVotes[1].points = '70'
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(200)
					.expect(res => {
						let votes = res.body
						votes.should.be.an('array').with.length(2)

						let firstVote = votes[0]
						firstVote.should.have.property('id')
						firstVote.should.have.property('participantId').equal(1)
						firstVote.should.have.property('placeId').equal(1)
						firstVote.should.have.property('points').equal(30)
						firstVote.should.have.property('place').which.is.an('object')
					})
					.end(done)
			})

			it('successfully adds a single vote', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send([{
						participantId: 1,
						placeId: 1,
						points: 40
					}])
					.expect(200)
					.expect(res => {
						let votes = res.body
						votes.should.be.an('array').with.length(1)

						let vote = votes[0]
						vote.should.have.property('id')
						vote.should.have.property('participantId').equal(1)
						vote.should.have.property('placeId').equal(1)
						vote.should.have.property('place').which.is.an('object')
						vote.should.have.property('points').equal(40)
					})
					.end(done)
			})

			it('successfully adds a bunch of votes', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send(newVotes)
					.expect(200)
					.expect(res => {
						let votes = res.body
						votes.should.be.an('array').with.length(2)

						let firstVote = votes[0]
						firstVote.should.have.property('id')
						firstVote.should.have.property('participantId').equal(1)
						firstVote.should.have.property('placeId').equal(1)
						firstVote.should.have.property('points').equal(40)
						firstVote.should.have.property('place').which.is.an('object')

					})
					.end(done)
			})
		})

		describe('/:voteId', () => {
			describe('GET', () => {
				before(async () => {
					await setup.resetData()
				})

				it('fails if user is not the participant linked to the vote', (done) => {
					request
						.get('/votes/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'Vote',
								id: 1,
								operation: 'READ'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('fails with 404 if vote does not exist', (done) => {
					request
						.get('/votes/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Vote', 99)
						})
						.end(done)
				})

				it('sends a correct vote resource', (done) => {
					request
						.get('/votes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							let vote = res.body
							vote.should.have.property('id').equal(1)
							vote.should.have.property('participantId').equal(1)
							vote.should.have.property('placeId').equal(2)
							vote.should.have.property('place').which.is.an('object')
							vote.should.have.property('points').equal(30)
						})
						.end(done)
				})
			})

			describe('DELETE', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('fails if user is not the participant linked to the vote', (done) => {
					request
						.delete('/votes/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'Vote',
								id: 1,
								operation: 'DELETE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('fails with 404 if vote does not exist', (done) => {
					request
						.delete('/votes/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Vote', 99)
						})
						.end(done)
				})

				it('deletes a vote successfully', async () => {
					await request
						.delete('/votes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/votes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})
			})
		})
	})
}
