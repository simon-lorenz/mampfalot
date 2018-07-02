const setup = require('../setup')

module.exports = (request, bearerToken) => {
  return describe.skip('/foodTypes', () => {
    describe('/:foodTypeId', () => {
      describe('GET', () => {
  
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