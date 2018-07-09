const setup = require('../setup')

module.exports = (request, bearerToken) => {
	return describe('/participants', () => {
		describe('/:participantId', () => {
			describe('GET', () => {
				it('sends a valid participant resource', (done) => {
					request
						.get('/participants/1')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							let participant = res.body
							participant.should.have.property('id').equal(1)
							participant.should.have.property('lunchbreakId').equal(1)
							participant.should.have.property('userId').equal(1)
							participant.should.have.property('lunchTimeSuggestion')
							participant.should.not.have.property('amountSpent')
						})
						.end(done)
				})
			})

			describe('/votes', () => {
				describe('GET', () => {
					it('sends a list of votes', (done) => {
						request 
						.get('/participants/1/votes')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							let votes = res.body
							votes.should.be.an('array').which.has.a.lengthOf(3)
							
							let firstVote = votes[0]
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