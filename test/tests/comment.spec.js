const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')

describe('Comment', () => {

	describe('/groups/:groupId/lunchbreaks/:date/comments', () => {
		describe('POST', () => {
			let newComment

			beforeEach(async () => {
				newComment = {
					text: 'Hey ho, let\'s go!'
				}
				await setupDatabase()
			})

			it('fails if no comment is provided', async () => {
				newComment.text = undefined
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/comments')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(newComment)
					.expect(400)
					.expect(res => {
						errorHelper.checkRequestError(res.body)
					})
			})

			it('fails if comment is empty', async () => {
				newComment.text = ''
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/comments')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(newComment)
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'comment',
							value: newComment.text,
							message: 'comment cannot be empty.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})

			it('inserts a userId depending on the token, not the body userId', async () => {
				newComment.userId = 3
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/comments')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(newComment)
					.expect(201)
					.expect(res => {
						const comment = res.body
						comment.author.username.should.be.eql('johndoe1')
					})
			})

			it('successfully adds a comment', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/comments')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(newComment)
					.expect(201)
					.expect(res => {
						const comment = res.body
						comment.should.have.all.keys(testData.getCommentKeys())
						comment.author.should.be.deep.eql(testData.getGroupMember(2))
						comment.text.should.be.eql(newComment.text)
					})
			})
		})
	})

	describe('/groups/:groupId/lunchbreaks/:date/comments/:commentId', () => {
		describe('PUT', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('fails if userId does not match', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/comments/1')
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
					.put('/groups/1/lunchbreaks/2018-06-25/comments/1')
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
					.put('/groups/1/lunchbreaks/2018-06-25/comments/1')
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
					.put('/comments/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Comment', 99)
					})
			})

			it('updates a comment correctly', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/comments/1')
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
					.delete('/groups/1/lunchbreaks/2018-06-25/comments/1')
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
					.delete('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Comment', 1)
					})
			})

			it('does not delete the associated user', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('does not delete the associated lunchbreak', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})
		})
	})
})
