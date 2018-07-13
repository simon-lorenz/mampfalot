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

      describe('POST', () => {
        let updatedPlace

        beforeEach(async () => {
          await setup.resetData()
          updatedPlace = {
            name: 'updated',
            foodTypeId: 2
          }
        })

        it('requires group admin rights', (done) => {
          request	
            .post('/places/1')
            .set({ Authorization: bearerToken[2] })
            .expect(403, done)
        })

        it('updates a new place correctly', (done) => {
          request
            .post('/places/1')
            .set({ Authorization: bearerToken[1] })
            .send(updatedPlace)
            .expect(200)
            .expect(response => {
              let place = response.body
              place.should.have.property('id')
              place.should.have.property('name').equal(updatedPlace.name)
              place.should.have.property('foodTypeId').equal(updatedPlace.foodTypeId)
              place.should.have.property('groupId').equal(1)
            })
            .end(done)
        })

        it('sends 400 on non existent foreign key', (done) => {
          updatedPlace.foodTypeId = 99 // non existent foodTypeId
          request
            .post('/places/1')
            .set({ Authorization: bearerToken[1] })
            .send(updatedPlace)
            .expect(400, done)
        })

        it('sends 400 on non-group foreign key', (done) => {
          updatedPlace.foodTypeId = 5 // this id belongs to group 2
          request
            .post('/places/1')
            .set({ Authorization: bearerToken[1] })
            .send(updatedPlace)
            .expect(400, done)
        })

        it('sends 400 if no name and foodTypeId is provided', (done) => {
          request
            .post('/places/1')
            .set({ Authorization: bearerToken[1] })
            .send( {} )
            .expect(400, done)
        })
      })

      describe('DELETE', () => {
        beforeEach(async () => {
          await setup.resetData()
        })

        it('requires group admin rights', (done) => {
          request 
            .delete('/places/1')
            .set({ Authorization: bearerToken[2] })
            .expect(403, done)
        })

        it('deletes a place successfully', (done) => {
          request
            .delete('/places/1')
            .set({ Authorization: bearerToken[1] })
            .expect(204)
            .end(done)
        })
      })
    })
  })
}