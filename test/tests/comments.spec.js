const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')

describe('/comments', () => {
	describe('/:id', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('fails if user is no group member', async () => {
				await request
					.get('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Comment',
							id: 1,
							operation: 'READ',
							message: 'You do not have the necessary permissions for this operation.'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('returns 404 if comment does not exist', async () => {
				await request
					.get('/comments/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Comment', 99)
					})
			})

			it('returns a single comment resource if user is in the same group', async () => {
				await request
					.get('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						const comment = res.body
						comment.should.have.all.keys(['id', 'userId', 'lunchbreakId', 'comment', 'updatedAt', 'createdAt'])
						comment.id.should.be.equal(1)
						comment.userId.should.be.equal(1)
						comment.lunchbreakId.should.be.equal(1)
						comment.comment.should.be.equal('Dies ist ein erster Kommentar von Max Mustermann')
					})
			})
		})

		describe('POST', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if userId does not match', async () => {
				await request
					.post('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Comment',
							id: 1,
							operation: 'UPDATE',
							message: 'You do not have the necessary permissions for this operation.'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails if no new comment is provided', async () => {
				await request
					.post('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'comment',
							value: null,
							message: 'comment cannot be null.'
						}

						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if new comment is empty', async () => {
				await request
					.post('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ comment: '' })
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'comment',
							value: '',
							message: 'comment cannot be empty.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('fails if comment does not exist', async () => {
				await request
					.post('/comments/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Comment', 99)
					})
			})

			it('updates a comment correctly', async () => {
				await request
					.post('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ comment: 'New comment text!' })
					.expect(200)
					.expect(res => {
						const comment = res.body
						comment.should.have.property('id').equal(1)
						comment.should.have.property('userId').equal(1)
						comment.should.have.property('comment').equal('New comment text!')
					})
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if user does not own comment', async () => {
				await request
					.delete('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Comment',
							id: 1,
							operation: 'DELETE',
							message: 'You do not have the necessary permissions for this operation.'
						}

						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('fails if comment does not exist', async () => {
				await request
					.delete('/comments/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Comment', 99)
					})
			})

			it('deletes a comment successfully', async () => {
				await request
					.delete('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Comment', 1)
					})
			})

			it('does not delete the associated user', async () => {
				await request
					.delete('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('does not delete the associated lunchbreak', async () => {
				await request
					.delete('/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/lunchbreaks/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})
		})
	})
})
