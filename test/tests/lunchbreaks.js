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
              lunchbreak.should.have.property('comments')
              lunchbreak.should.have.property('participants')
              let firstParticipant = lunchbreak.participants[0]
              firstParticipant.should.have.property('votes')
              firstParticipant.should.have.property('user')
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

        describe('POST', () => {
          beforeEach(async () => {
            await setup.resetData()
          })

          it('requires auth', (done) => {
            request 
              .post('/lunchbreaks/3/participants')
              .expect(401, done)
          })

          it('fails if no userId is provided', (done) => {
            request
              .post('/lunchbreaks/3/participants')
              .set({ Authorization: bearerToken[2] })
              .expect(400, done)
          })

          it('fails if user tries to post another user', (done) => {
            request
              .post('/lunchbreaks/3/participants')
              .set({ Authorization:  bearerToken[1] })
              .send({ userId: 2 })
              .expect(403, done)
          })

          it('fails if user is no group member', (done) => {
            request
              .post('/lunchbreaks/3/participants')
              .set({ Authorization: bearerToken[3] })
              .send({ userId: 3 })
              .expect(403, done)
          })

          it('fails if user already participates', (done) => {
            request
              .post('/lunchbreaks/1/participants')
              .set({ Authorization: bearerToken[1] })
              .send({ userId: 1 })
              .expect(400, done)
          })

          it('successfully adds a participant', (done) => {
            request
              .post('/lunchbreaks/3/participants')
              .set({ Authorization: bearerToken[2] })
              .send({ userId: 2 })
              .expect(200)
              .expect(res => {
                let participant = res.body
                participant.should.have.property('id')
                participant.should.have.property('userId').equal(2)
                participant.should.have.property('lunchbreakId').equal(3)
              })
              .end(done)
            })
        })
      })

      describe('/comments', () => {
        describe('GET', () => {
          before(async () => {
            await setup.resetData()
          })
          
          it('requires auth', (done) => {
            request
              .get('/lunchbreaks/1/comments')
              .expect(401, done)
          })

          it('fails if user is no group member', (done) => {
            request
              .get('/lunchbreaks/1/comments')
              .set({ Authorization: bearerToken[3] })
              .expect(403, done)
            })

            it('sends a correct comment collection', (done) => {
              request
                .get('/lunchbreaks/1/comments')
                .set({ Authorization: bearerToken[2] })
                .expect(200)
                .expect(res => {
                  let comments = res.body
                  comments.should.be.an('array').with.lengthOf(3)

                  let firstComment = comments[0]
                  firstComment.should.have.property('id').equal(1)
                  firstComment.should.have.property('userId').equal(1)
                  firstComment.should.have.property('lunchbreakId').equal(1)
                  firstComment.should.have.property('comment').equal('Dies ist ein erster Kommentar von Max Mustermann')
                  firstComment.should.have.property('createdAt')
                  firstComment.should.have.property('updatedAt')
                })
                .end(done)
            })
        })

        describe('POST', () =>  {
          let newComment

          beforeEach(async () => {
            newComment = {
              comment: 'Hey ho, let\'s go!'
            }
            await setup.resetData()
          })

          it('requires auth', (done) => {
            request
              .post('/lunchbreaks/1/comments')
              .expect(401, done)
          })

          it('fails if user is no group member', (done) => {
            request
              .post('/lunchbreaks/1/comments')
              .set({ Authorization: bearerToken[3] })
              .expect(403, done)
          })

          it('fails if no comment is provided', (done) => {
            newComment.comment = ''
            request
              .post('/lunchbreaks/1/comments')
              .set({ Authorization: bearerToken[2] })
              .send(newComment)
              .expect(400, done)
          })

          it('inserts a userId depending on the token, not the body userId', (done) => {
            newComment.userId = 3
            request
              .post('/lunchbreaks/1/comments')
              .set({ Authorization: bearerToken[2] })
              .send(newComment)
              .expect(200)
              .expect(res => {
                let comment = res.body
                comment.should.have.property('userId').equal(2)
              })
              .end(done)
          })

          it('successfully adds a comment', (done) => {
            request
              .post('/lunchbreaks/1/comments')
              .set({ Authorization: bearerToken[2] })
              .send(newComment)
              .expect(200)
              .expect(res => {
                let comment = res.body
                comment.should.have.property('id')
                comment.should.have.property('userId').equal(2)
                comment.should.have.property('lunchbreakId').equal(1)
                comment.should.have.property('comment').equal(newComment.comment)
                comment.should.have.property('createdAt')
                comment.should.have.property('updatedAt')
              })
              .end(done)
          })
        })
      })
    })
  })
}