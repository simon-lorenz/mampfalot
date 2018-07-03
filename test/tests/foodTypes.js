const setup = require('../setup')

module.exports = (request, bearerToken) => {
  return describe('/foodTypes', () => {
    describe('/:foodTypeId', () => {
      describe('GET', () => {
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
        before(async() => {
          await setup.resetData()
        })      

        afterEach(async() => {
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
  
      describe('GET', () => {
        
      })
    })
  })
}