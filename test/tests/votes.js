const setup = require('../setup')

module.exports = (request, bearerToken) => {
	return describe('/votes', () => {
		describe.skip('POST', () => {
			beforeEach(async () => {
				await setup.resetData()
			})

			it('requires auth', (done) => {
				request
					.post('/votes')
					.expect(401, done)
			})

			it('fails if participant.userId does not match the users id', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send({
						participantId: 2,
						lunchbreakId: 1
					})
					.expect(403, done)
			})

			it('fails with 404 if participantId does not exist', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send({
						participantId: 99
					})
					.expect(404, done)
			})

			it('fails with 404 if lunchbreak does not exist', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send({
						participantId: 1,
						lunchbreakId: 99
					})
					.expect(404, done)
			})

			it('fails if place id does not belong to group', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send({
						participantId: 1,
						lunchbreakId: 1,
						placeId: 5
					})
					.expect(400, done)
			})

			it('fails sum of points is greater than pointsPerDay', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send({
						participantId: 1,
						lunchbreakId: 1,
						placeId: 1,
						points: 20
					})
					.expect(400)
					.end(done)		
			})

			it('fails if points is greater than maxPointsPerVote', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send({
						participantId: 1,
						lunchbreakId: 1,
						placeId: 1,
						points: 101
					})
					.expect(400)
					.end(done)		
			})

			it('fails if points is lesser than minPointsPerVote', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send({
						participantId: 1,
						lunchbreakId: 1,
						placeId: 1,
						points: 29
					})
					.expect(400)
					.end(done)		
			})

			it('successfully adds a single vote', (done) => {
				request
					.post('/votes')
					.set({ Authorization: bearerToken[1] })
					.send({
						participantId: 1,
						lunchbreakId: 1,
						placeId: 1,
						points: 10
					})
					.expect(200)
					.expect(res => {
						let vote = res.body
						vote.should.have.property('id')
						vote.should.have.property('participantId').equal(1)
						vote.should.have.property('lunchbreakId').equal(1)
						vote.should.have.property('placeId').equal(1)
					})
					.end(done)		
			})
		})
	})
}