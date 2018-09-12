const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/comments', () => {
		describe('/:id', () => {
			describe('GET', () => {
				before(async () => {
					await setup.resetData()
				})

				it('fails if userId does not match', (done) => {
					request
						.get('/comments/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'Comment',
								id: 1,
								operation: 'READ',
								message: 'You do not have the necessary permissions for this operation.'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('returns 404 if comment does not exist', (done) => {
					request
						.get('/comments/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Comment', 99)
						})
						.end(done)
				})

				it('returns a single comment resource', (done) => {
					request
						.get('/comments/1')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							let comment = res.body
							comment.should.have.all.keys(['id', 'userId', 'lunchbreakId', 'comment', 'updatedAt', 'createdAt'])
							comment.id.should.be.equal(1)
							comment.userId.should.be.equal(1)
							comment.lunchbreakId.should.be.equal(1)
							comment.comment.should.be.equal('Dies ist ein erster Kommentar von Max Mustermann')
						})
						.end(done)
				})
			})

			describe('POST', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('fails if userId does not match', (done) => {
					request
						.post('/comments/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'Comment',
								id: 1,
								operation: 'UPDATE',
								message: 'You do not have the necessary permissions for this operation.'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('fails if no new comment is provided', (done) => {
					request
						.post('/comments/1')
						.set({ Authorization: bearerToken[1] })
						.expect(400)
						.expect(res => {
							let expectedError = {
								field: 'comment',
								value: null,
								message: 'comment cannot be null.'
							}

							errorHelper.checkValidationError(res.body)
						})
						.end(done)
				})

				it('fails if new comment is empty', (done) => {
					request
						.post('/comments/1')
						.set({ Authorization: bearerToken[1] })
						.send({ comment: '' })
						.expect(400)
						.expect(res => {
							let expectedError = {
								field: 'comment',
								value: '',
								message: 'comment cannot be empty.'
							}
						})
						.end(done)
				})

				it('fails if comment does not exist', (done) => {
					request
						.post('/comments/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Comment', 99)
						})
						.end(done)
				})

				it('updates a comment correctly', (done) => {
					request
						.post('/comments/1')
						.set({ Authorization: bearerToken[1] })
						.send({ comment: 'New comment text!' })
						.expect(200)
						.expect(res => {
							let comment = res.body
							comment.should.have.property('id').equal(1)
							comment.should.have.property('userId').equal(1)
							comment.should.have.property('comment').equal('New comment text!')
						})
						.end(done)
				})
			})

			describe('DELETE', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('fails if user does not own comment', (done) => {
					request
						.delete('/comments/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'Comment',
								id: 1,
								operation: 'DELETE',
								message: 'You do not have the necessary permissions for this operation.'
							}

							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('fails if comment does not exist', (done) => {
					request
						.delete('/comments/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Comment', 99)
						})
						.end(done)
				})

				it('deletes a comment successfully', async () => {
					await request
						.delete('/comments/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/comments/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Comment', 1)
						})
				})
			})
		})
	})
}
