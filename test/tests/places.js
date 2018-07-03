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
  })
}