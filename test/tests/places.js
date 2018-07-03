const setup = require('../setup')

module.exports = (request, bearerToken) => {
  return describe('/places', () => {
    describe('POST', () => {
      let newPlace

      beforeEach(async () => {
        newPlace = { name: 'new place', groupId: 1, foodTypeId: 1 }
        await setup.resetData()
      })

      it('requires authentication', (done) => {
        request 
          .post('/places')
          .expect(401, done)
      })

      it('requires group admin rights', (done) => {
        request
          .post('/places')
          .set({ Authorization: bearerToken[2] })
          .send(newPlace)
          .expect(403, done)
      })

      it('fails if the foodTypeId doesn\'t belong to the group', (done) => {
        newPlace.foodTypeId = 5
        request
          .post('/places')
          .set({ Authorization: bearerToken[1] })
          .send(newPlace)
          .expect(400, done)
      })

      it('inserts new place correctly', (done) => {
        request
          .post('/places')
          .set({ Authorization: bearerToken[1] })
          .send(newPlace)
          .expect(200)
          .expect(res => {
            let place = res.body
            place.should.have.property('id')
            place.should.have.property('groupId').equals(newPlace.groupId)
            place.should.have.property('foodTypeId').equals(newPlace.foodTypeId)
            place.should.have.property('name').equals(newPlace.name)
          })
          .end(done)
      })
    })

    describe('/:placeId', () => {
      describe('GET', () => {
        before(async () => {
          await setup.resetData()
        })

        it('requires authentication', (done) => {
          request
            .get('/places/1')
            .expect(401, done)
        })

        it('fails if user is no group member', (done) => {
          request
            .get('/places/1')
            .set({ Authorization: bearerToken[3] })
            .expect(403, done)
        })

        it('sends 404 if resource does\'t exist', (done) => {
          request
            .get('/places/99')
            .set({ Authorization: bearerToken[1] })
            .expect(404, done)
        })

        it('responds with a correct place resource', (done) => {
          request
            .get('/places/1')
            .set({ Authorization: bearerToken[2] })
            .expect(200)
            .expect(res => {
              let place = res.body
              place.should.have.property('id').equals(1)
              place.should.have.property('groupId').equals(1)
              place.should.have.property('foodTypeId').equals(2)
              place.should.have.property('name').equals('VIP-Döner')
            })
            .end(done)
        })
      })
    })
  })
}