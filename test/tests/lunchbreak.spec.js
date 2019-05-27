const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const testServer = require('../utils/test-server')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')

describe('Lunchbreak', () => {

	describe('/groups/:groupId/lunchbreaks', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('requires query values from and to', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						errorHelper.checkRequiredQueryValues(res.body, ['from', 'to'], true)
					})
			})

			it('fails if to is greater than from')

			it('treats the query dates as inclusive values')

			it('sends a valid lunchbreak collection', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-01-01', to: '2018-12-31' })
					.expect(200)
					.expect(res => {
						res.body.should.be.deep.eql(testData.getLunchbreaks(1))
					})
			})
		})

		describe('POST', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if user is not member of the group', async () => {
				await request
					.post('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.send({
						date: '2018-06-30',
						lunchTime: '13:00:00',
						voteEndingTime: '12:59:00'
					})
					.expect(403)
					.expect(res =>  {
						const expectedError = {
							resource: 'Lunchbreak',
							id: null,
							operation: 'CREATE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('creates a new lunchbreak successfully when user is no admin', async () => {
				await request
					.post('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send({ date: '2018-06-30' })
					.expect(200)
					.expect(res => {
						const lunchbreak = res.body
						lunchbreak.should.have.property('id')
						lunchbreak.should.have.property('groupId').equal(1)
						lunchbreak.should.have.property('date').equal('2018-06-30')
					})
			})

			it('fails if no date is provided', async () => {
				await request
					.post('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send({})
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body)
					})
			})

			it('fails if a lunchbreak at this date exists', async () => {
				await request
					.post('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send({
						date: '2018-06-25'
					})
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'date',
							value: '2018-06-25',
							message: 'A lunchbreak at this date already exists.'
						}

						errorHelper.checkValidationError(res.body, expectedError)
					})
			})
		})
	})

	describe('/groups/:groupId/lunchbreaks/:date', () => {
		describe('GET', () => {
			before(async() => {
				await setupDatabase()
			})

			it('returns NotFoundError', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-30')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Lunchbreak', null)
					})
			})

			it('fails if user isn\'t a group member', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Lunchbreak',
							id: 1,
							operation: 'READ'
						}

						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('sends a correct lunchbreak resource', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getLunchbreak(1, '2018-06-25'))
						res.body.comments.should.be.sortedBy('createdAt', { descending: true })
					})

				await request
					.get('/groups/2/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getLunchbreak(2, '2018-06-25'))
						res.body.comments.should.be.sortedBy('createdAt', { descending: true })
					})

				await request
					.get('/groups/1/lunchbreaks/2018-06-26')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getLunchbreak(1, '2018-06-26'))
						res.body.comments.should.be.sortedBy('createdAt', { descending: true })
					})
			})
		})
	})

})

describe('/lunchbreaks', () => {
	describe('/:lunchbreakId', () => {
		describe('/participants', () => {
			describe('GET', () => {
				before(async () => {
					await setupDatabase()
				})

				it('sends a list of participants', async () => {
					await request
						.get('/lunchbreaks/1/participants')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.expect(200)
						.expect(res => {
							const participants = res.body
							participants.should.be.an('array').which.has.length(2)
							const firstParticipant = participants[0]
							firstParticipant.should.have.property('id').equal(1)
							firstParticipant.should.have.property('lunchbreakId').equal(1)
							firstParticipant.should.have.property('userId').equal(1)
							firstParticipant.should.not.have.property('amountSpent')
						})
				})
			})

			describe('POST', () => {
				beforeEach(async () => {
					testServer.start(5001, '11:24:59', '25.06.2018')
					await setupDatabase()
				})

				it('ignores provided userIds and inserts depending on token', async () => {
					await request
						.post('/lunchbreaks/3/participants')
						.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
						.expect(200)
						.expect(res => {
							const participant = res.body
							participant.should.have.property('userId').equal(1)
						})
				})

				it('fails if user is no group member', async () => {
					await request
						.post('/lunchbreaks/3/participants')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(403)
						.expect(res => {
							const expectedError = {
								resoucre: 'Participant',
								value: null,
								operation: 'CREATE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
				})

				it('fails if user already participates', async () => {
					await request
						.post('/lunchbreaks/1/participants')
						.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
						.expect(400)
						.expect(res => {
							const expectedError = {
								field: 'userId',
								value: '1',
								message: 'This user already participates.'
							}
							errorHelper.checkValidationError(res.body, expectedError)
						})
				})

				it('fails if voteEndingTime is reached', async () => {
					testServer.start(5001, '11:25:01', '25.06.2018')
					await request
						.post('/lunchbreaks/1/participants')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.expect(400)
						.expect(res => {
							const MESSAGE = 'The end of voting has been reached, therefore you cannot participate anymore.'
							errorHelper.checkRequestError(res.body, MESSAGE)
						})
				})

				it('successfully adds a participant', async () => {
					await request
						.post('/lunchbreaks/3/participants')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.expect(200)
						.expect(res => {
							const participant = res.body
							participant.should.have.property('id')
							participant.should.have.property('userId').equal(2)
							participant.should.have.property('lunchbreakId').equal(3)
						})
				})
			})
		})

		describe('/comments', () => {
			describe('GET', () => {
				before(async () => {
					await setupDatabase()
				})

				it('fails if user is no group member', async () => {
					await request
						.get('/lunchbreaks/1/comments')
						.set(await TokenHelper.getAuthorizationHeader('loten'))
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'Lunchbreak',
								id: 1,
								operation: 'READ'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
				})

				it('sends a correct comment collection', async () => {
					await request
						.get('/lunchbreaks/1/comments')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.expect(200)
						.expect(res => {
							const comments = res.body
							comments.should.be.an('array').with.lengthOf(3)

							const firstComment = comments[0]
							firstComment.should.have.property('id').equal(1)
							firstComment.should.have.property('userId').equal(1)
							firstComment.should.have.property('lunchbreakId').equal(1)
							firstComment.should.have.property('comment').equal('Dies ist ein erster Kommentar von Max Mustermann')
							firstComment.should.have.property('createdAt')
							firstComment.should.have.property('updatedAt')
						})
				})
			})

			describe('POST', () =>  {
				let newComment

				beforeEach(async () => {
					newComment = {
						comment: 'Hey ho, let\'s go!'
					}
					await setupDatabase()
				})

				it('fails if no comment is provided', async () => {
					newComment.comment = undefined
					await request
						.post('/lunchbreaks/1/comments')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.send(newComment)
						.expect(400)
						.expect(res => {
							errorHelper.checkRequestError(res.body)
						})
				})

				it('fails if comment is empty', async () => {
					newComment.comment = ''
					await request
						.post('/lunchbreaks/1/comments')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.send(newComment)
						.expect(400)
						.expect(res => {
							const expectedError = {
								field: 'comment',
								value: newComment.comment,
								message: 'comment cannot be empty.'
							}
							errorHelper.checkValidationError(res.body, expectedError)
						})
				})

				it('inserts a userId depending on the token, not the body userId', async () => {
					newComment.userId = 3
					await request
						.post('/lunchbreaks/1/comments')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.send(newComment)
						.expect(200)
						.expect(res => {
							const comment = res.body
							comment.should.have.property('userId').equal(2)
						})
				})

				it('successfully adds a comment', async () => {
					await request
						.post('/lunchbreaks/1/comments')
						.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
						.send(newComment)
						.expect(200)
						.expect(res => {
							const comment = res.body
							comment.should.have.property('id')
							comment.should.have.property('userId').equal(2)
							comment.should.have.property('lunchbreakId').equal(1)
							comment.should.have.property('comment').equal(newComment.comment)
							comment.should.have.property('createdAt')
							comment.should.have.property('updatedAt')
						})
				})
			})
		})
	})
})
