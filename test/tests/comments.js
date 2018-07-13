const setup = require('../setup')

module.exports = (request, bearerToken) => {
	return describe('/comments', () => {
		describe('/:id', () => {
			describe('POST', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('requires auth', (done) => {
					request
						.post('/comments/1')
						.expect(401, done)
				})

				it('fails if userId does not match', (done) => {
					request
						.post('/comments/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403, done)
				})

				it('fails if no new comment is provided', (done) => {
					request
						.post('/comments/1')
						.set({ Authorization: bearerToken[1] })
						.expect(400, done)
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

				it('requires auth', (done) => {
					request
						.delete('/comments/1')
						.expect(401, done)
				})

				it('fails if user does not own comment', (done) => {
					request	
						.delete('/comments/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403, done)
				})

				it('deletes a comment successfully', (done) => {
					request
						.delete('/comments/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204, done)
				})
			})
		})
	})
}