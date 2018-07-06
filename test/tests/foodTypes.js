const setup = require('../setup')

module.exports = (request, bearerToken) => {
  return describe('/foodTypes', () => {
    describe('POST', () => {
      let newFoodType

      beforeEach(async () => {
        newFoodType = { 
          groupId: 1,
          type: 'New food type' 
        }
        await setup.resetData()
      })

      it('requires authentication', (done) => {
        request
          .post('/foodTypes')
          .send(newFoodType)
          .expect(401, done)
      })

      it('fails if user is no group admin', (done) => {
        request
          .post('/foodTypes')
          .set({ Authorization: bearerToken[2] })
          .send(newFoodType)
          .expect(403, done)
      })

      it('inserts a new foodType correctly', (done) => {
        request
          .post('/foodTypes')
          .set({ Authorization: bearerToken[1] })
          .send(newFoodType)
          .expect(200)
          .expect(res => {
            let foodType = res.body
            foodType.should.have.property('id')
            foodType.should.have.property('groupId').equal(newFoodType.groupId)
            foodType.should.have.property('type').equal(newFoodType.type)
          })
          .end(done)
      })
    })

    describe('/:foodTypeId', () => {
      describe('GET', () => {
        before(async () => {
          await setup.resetData()
        })

        it('requires authentication', (done) => {
          request
            .get('/foodTypes/1')
            .expect(401, done)
        })

        it('fails with 403 if user is no group member', (done) => {
          request
            .get('/foodTypes/1')
            .set({ Authorization: bearerToken[3] })
            .expect(403, done)
        })

        it('sends a correct foodType resource', (done) => {
          request
            .get('/foodTypes/1')
            .set({ Authorization: bearerToken[2] })
            .expect(200)
            .expect(res => {
              let foodType = res.body
              foodType.should.have.property('id').equal(1)
              foodType.should.have.property('type').equal('Asiatisch')              
            })
            .end(done)
        })
      })
  
      describe('DELETE', () => {
        beforeEach(async() => {
          await setup.resetData()
        })

        it('requires group admin rights', (done) => {
          request
            .delete('/foodTypes/1')
            .set({ Authorization: bearerToken[2] })
            .expect(403, done)
          })
        
        it('deletes a foodType correctly', (done) => {
          request
            .delete('/foodTypes/1')
            .set({ Authorization: bearerToken[1] })
            .expect(204, done)
          })
      })
    })
  })
}