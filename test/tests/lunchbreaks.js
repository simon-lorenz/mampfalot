const setup = require('../setup')

module.exports = (request, bearerToken) => {
  return describe('/lunchbreaks', () => {
    describe('/:lunchbreakId', () => {
      describe('GET', () => {
        before(async() => {
          await setup.resetData()
        })

        it('requires auth', (done) => {
          request
            .get('/lunchbreaks/1')
            .expect(401, done)
        })

        it('fails if user isn\'t a group member', (done) => {
          request
            .get('/lunchbreaks/1')
            .set({ Authorization: bearerToken[3] })
          	.expect(403, done)
          })

        it('sends a correct lunchbreak resource', (done) => {
          request
            .get('/lunchbreaks/1')
            .set({ Authorization: bearerToken[2] })
            .expect(200)
            .expect(res => {
              let lunchbreak = res.body
              lunchbreak.should.have.property('id').equal(1)
              lunchbreak.should.have.property('groupId').equal(1)
              lunchbreak.should.have.property('date').equal('2018-06-25')
              lunchbreak.should.have.property('lunchTime').equal('12:30:00')
              lunchbreak.should.have.property('voteEndingTime').equal('12:25:00')
            })
            .end(done)
          })
      })

      describe('POST', () => {
        beforeEach(async () => {
          await setup.resetData()
        })

        it('requires auth', (done) => {
          request
            .post('/lunchbreaks/1')
            .expect(401, done)
        })

        it('fails if the user is no group admin', (done) => {
          request
            .post('/lunchbreaks/1')
            .set({ Authorization: bearerToken[2] })
            .expect(403, done)
        })

        it('requires at least one parameter', (done) => {
          request
            .post('/lunchbreaks/1')
            .set({ Authorization: bearerToken[1] })
            .send({ })
            .expect(400, done)
        })

        it('fails if voteEndingTime is greater than lunchTime', (done) => {
          request
            .post('/lunchbreaks/1')
            .set({ Authorization: bearerToken[1] })
            .send({ 
              voteEndingTime: '13:00:00',
              lunchTime: '12:59:00'
            })
            .expect(400, done)
        })

        it('doesn\'t update the date', (done) => {
          request
            .post('/lunchbreaks/1')
            .set({ Authorization: bearerToken[1] })
            .send({ date: '31.12.2019' })
            .expect(400, done)
        })

        it('updates a lunchbreak successfully', (done) => {
          let newTimes = {
            voteEndingTime: '12:55:00',
            lunchTime: '13:00:00'
          }
          
          request
            .post('/lunchbreaks/1')
            .set({ Authorization: bearerToken[1] })
            .send(newTimes)
            .expect(200)
            .expect(res => {
              let lunchbreak = res.body
              lunchbreak.should.have.property('id').equal(1)
              lunchbreak.should.have.property('voteEndingTime').equal(newTimes.voteEndingTime)
              lunchbreak.should.have.property('lunchTime').equal(newTimes.lunchTime)
            })
            .end(done)
        })
      })

      describe('/participants', () => {
        describe('GET', () => {
          before(async () => {
            await setup.resetData()
          })

          it('sends a list of participants', (done) => {
            request
              .get('/lunchbreaks/1/participants')
              .set({ Authorization: bearerToken[2] })
              .expect(200)
              .expect(res => {
                let participants = res.body
                participants.should.be.an('array').which.has.length(2)
                let firstParticipant = participants[0]
                firstParticipant.should.have.property('id').equal(1)
                firstParticipant.should.have.property('lunchbreakId').equal(1)
                firstParticipant.should.have.property('userId').equal(1)
                firstParticipant.should.have.property('lunchTimeSuggestion')
                firstParticipant.should.not.have.property('amountSpent')
              })
              .end(done)
          })
        })

        describe('/:participantId', () => {
          it('sends a valid participant resource', (done) => {
            request
              .get('/lunchbreaks/1/participants/1')
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

          describe('/votes', () => {
            it('sends a list of votes', (done) => {
              request 
              .get('/lunchbreaks/1/participants/1/votes')
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
  })
}