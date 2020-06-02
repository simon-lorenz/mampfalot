const Boom = require('@hapi/boom')
const setupDatabase = require('../utils/scripts/setup-database')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')
const testServer = require('../utils/test-server')

describe('Comment', () => {
	describe('/groups/:groupId/lunchbreaks/:date/comments', () => {
		describe('POST', () => {
			let newComment

			beforeEach(async () => {
				newComment = {
					text: "Hey ho, let's go!"
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
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"text" is required',
						validation: {
							source: 'payload',
							keys: ['text']
						}
					})
			})

			it('fails if comment is empty', async () => {
				newComment.text = ''
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/comments')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(newComment)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"text" is not allowed to be empty',
						validation: {
							source: 'payload',
							keys: ['text']
						}
					})
			})

			it('fails if comment is null', async () => {
				newComment.text = null
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/comments')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(newComment)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"text" must be a string',
						validation: {
							source: 'payload',
							keys: ['text']
						}
					})
			})

			it('inserts a userId depending on the token, not the body userId', async () => {
				newComment.userId = 3
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/comments')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(newComment)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"userId" is not allowed',
						validation: {
							source: 'payload',
							keys: ['userId']
						}
					})
			})

			it('does not create a lunchbreak if voteEndingTime is reached', async () => {
				await testServer.start(5001, '11:25:01', '01.07.2018')

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: 'Please create a luchbreak, thanks.'
					})
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting is reached, therefore you cannot create a new lunchbreak.').output
							.payload
					)
			})

			it('does not create a lunchbreak if the date lies in the past', async () => {
				await testServer.start(5001, '11:25:01', '01.07.2018')

				await request
					.get('/groups/1/lunchbreaks/2018-06-30')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)

				await request
					.post('/groups/1/lunchbreaks/2018-06-30/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: 'Please create a luchbreak, thanks.'
					})
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting is reached, therefore you cannot create a new lunchbreak.').output
							.payload
					)
			})

			it('creates a lunchbreak if none exists', async () => {
				await testServer.start(5001, '11:24:59', '01.07.2018')

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: 'Please create a luchbreak, thanks.'
					})
					.expect(201)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.comments.should.be.an('array').with.lengthOf(1)
						res.body.comments[0].text.should.be.eql('Please create a luchbreak, thanks.')
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
					.send({ text: 'new text!' })
					.expect(403)
					.expect(Boom.forbidden().output.payload)
			})

			it('requires text in body', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({})
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"text" is required',
						validation: {
							source: 'payload',
							keys: ['text']
						}
					})
			})

			it('fails if text is null', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ text: null })
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"text" must be a string',
						validation: {
							source: 'payload',
							keys: ['text']
						}
					})
			})

			it('fails if text is empty', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ text: '' })
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"text" is not allowed to be empty',
						validation: {
							source: 'payload',
							keys: ['text']
						}
					})
			})

			it('fails if comment does not exist', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/comments/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ text: 'new text' })
					.expect(404)
					.expect(Boom.notFound().output.payload)
			})

			it('updates a comment correctly', async () => {
				await request
					.put('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({ text: 'New comment text!' })
					.expect(200)
					.expect(res => {
						const comment = res.body
						comment.should.have.all.keys(testData.getCommentKeys())
						comment.author.should.be.deep.eql(testData.getGroupMember(1))
						comment.text.should.be.equal('New comment text!')
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
					.expect(Boom.forbidden().output.payload)
			})

			it('fails if comment does not exist', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/comments/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(Boom.notFound().output.payload)
			})

			it('deletes a comment successfully', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/comments/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(res => {
						const comments = res.body.comments
						if (comments.find(comment => comment.id === 1)) {
							throw new Error('Comment was not deleted!')
						}
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

			it('does not delete the associated lunchbreak if there are other participants', async () => {
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

				const id = await request
					.post('/groups/1/lunchbreaks/2018-07-01/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: 'My new comment.'
					})
					.expect(201)
					.then(res => res.body.id)

				await request
					.delete(`/groups/1/lunchbreaks/2018-07-01/comments/${id}`)
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('does not delete the associated lunchbreak if there are absences', async () => {
				await testServer.start(5001, '11:24:59', '01.07.2018')

				const id = await request
					.post('/groups/1/lunchbreaks/2018-07-01/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: 'delete me!'
					})
					.expect(201)
					.then(res => res.body.id)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(201)

				await request
					.delete(`/groups/1/lunchbreaks/2018-07-01/comments/${id}`)
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
							.property('comments')
							.which.is.an('array')
							.with.lengthOf(0)
					})
			})

			it('does not delete the associated lunchbreak if there are other comments', async () => {
				await testServer.start(5001, '11:24:59', '01.07.2018')

				const id = await request
					.post('/groups/1/lunchbreaks/2018-07-01/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: 'Please create a luchbreak, thanks.'
					})
					.expect(201)
					.then(res => res.body.id)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: 'And do not delete it.'
					})
					.expect(201)

				await request
					.delete(`/groups/1/lunchbreaks/2018-07-01/comments/${id}`)
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('does delete the lunchbreak, if there are no other comments or participants', async () => {
				await testServer.start(5001, '11:24:59', '01.07.2018')

				const id = await request
					.post('/groups/1/lunchbreaks/2018-07-01/comments')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({
						text: 'Please create a luchbreak, thanks.'
					})
					.expect(201)
					.then(res => res.body.id)

				await request
					.delete(`/groups/1/lunchbreaks/2018-07-01/comments/${id}`)
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})
		})
	})
})
