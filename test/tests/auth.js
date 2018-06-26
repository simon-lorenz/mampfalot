module.exports = (request, token) => {
  return describe('/auth', () => {
    describe('GET', () => {
      it('authenticates a user with correct credentials', (done) => {
        request
          .get('/auth')
          .auth('mustermann@gmail.com', '123456')
          .expect(200, done)
      })

      it('responds with a well formed token', (done) => {
        request
          .get('/auth')
          .auth('mustermann@gmail.com', '123456')
          .expect(200, (err, res) => {
            let token = res.body.token
            let tokenPayload = token.split('.')[1]
            let payload = Buffer.from(tokenPayload, 'base64').toString()
            payload = JSON.parse(payload)
            payload.should.have.property('id').equal(1)
            payload.should.not.have.property('password')
            done()
          })
      })

      it('fails with 401 on wrong password', (done) => {
        request
          .get('/auth')
          .auth('max.mustermann@mail.com', 'wrongPassword')
          .expect(401, done)
      })

      it('fails with 401 on unknown email', (done) => {
        request
          .get('/auth')
          .auth('unkown@mail.de', 'supersafe')
          .expect(401, done)
      })
    })
  })
}