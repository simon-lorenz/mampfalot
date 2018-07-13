const setup = require('../setup')

module.exports = (request, bearerToken) => {
  return describe('/users', () => {
    describe('POST', () => {
      let newUser

      beforeEach(async () => {
        newUser = {
          name: 'Homer Simpson',
          email: 'homer@simpson.com',
          password: "springfield"
        }
        await setup.resetData()
      })

      it('inserts a user correctly', (done) => {
        request
          .post('/users')
          .send(newUser)
          .expect(200, (err, res) => {
            let user = res.body
            user.should.have.property('id')
            user.should.have.property('name').equal(newUser.name)
            user.should.have.property('email').equal(newUser.email)
            user.should.not.have.property('password')
            done()
          })
      })

      it('fails with 400 if no name is provided', (done) => {
        newUser.name = undefined

        request
          .post('/users')
          .send(newUser)
          .expect(400, done)
      })

      it('fails with 400 if no password is provided', (done) => {
        newUser.password = undefined

        request
          .post('/users')
          .send(newUser)
          .expect(400, done)
      })

      it('fails with 400 if no email is provided', (done) => {
        newUser.email = undefined

        request
          .post('/users')
          .send(newUser)
          .expect(400, done)
      })

      it('fails if email is already taken', (done) => {
        newUser.email = 'mustermann@gmail.com'

        request
          .post('/users')
          .send(newUser)
          .expect(400, done)
      })
    })

    describe('/:userId', () => {
      describe('GET', () => {
        it('requires authentication', (done) => {
          request
            .get('/users/1')
            .expect(401, done)
        })

        it('returns a valid user resource for Max Mustermann', (done) => {
          request
            .get('/users/1')
            .set({
              Authorization: bearerToken[1]
            })
            .expect(200, (err, res) => {
              let user = res.body
              user.should.have.property('id').equal(1)
              user.should.have.property('name').equal('Max Mustermann')
              user.should.have.property('email').equal('mustermann@gmail.com')
              user.should.not.have.property('password')
              done()
            })
        })

        it('returns a valid user resource for Philipp Loten', (done) => {
          request
            .get('/users/3')
            .set({
              Authorization: bearerToken[3]
            })
            .expect(200, (err, res) => {
              let user = res.body
              user.should.have.property('id').equal(3)
              user.should.have.property('name').equal('Philipp Loten')
              user.should.have.property('email').equal('philipp.loten@company.com')
              user.should.not.have.property('password')
              done()
            })
        })

        it('fails with 403 if user requests a resource other than himself', (done) => {
          request
            .get('/users/3')
            .set({
              Authorization: bearerToken[1]
            })
            .expect(403, done)
        })
      })

      describe('POST', () => {
        beforeEach(async() => {
          await setup.resetData()
        })

        it('requires authentication', (done) => {
          request
            .post('/users/1')
            .expect(401, done)
        })

        it('fails with 404 if user doesn\'t exist', (done) => {
          request
            .post('/users/99')
            .set({ Authorization: bearerToken[1]})
            .expect(404, done)
        })

        it('fails with 403 if user tries to update another user', (done) => {
          request
            .post('/users/3')
            .set({ Authorization: bearerToken[1]})
            .expect(403, done)
        })

        it('fails with 400 if not at least one parameter is provided', (done) => {
          request
            .post('/users/1')
            .set({ Authorization: bearerToken[1]})
            .send({})
            .expect(400, done)
        })

        it('updates a user correctly', (done) => {
          request
            .post('/users/1')
            .set({ Authorization: bearerToken[1]})
            .send({ name: 'Neuer Name', email: 'neu@mail.com', password: 'hurdur'})
            .expect(200, (err, res) => {
              let newUser = res.body
              newUser.should.have.property('id').equal(1)
              newUser.should.have.property('name').equal('Neuer Name')
              newUser.should.have.property('email').equal('neu@mail.com')
              // TODO: Passwort update?
              done()
            })
        })
      })

      describe('DELETE', () => {
        beforeEach(async () => {
          await setup.resetData()
        })

        it('fails with 403 if user tries to delete another user', (done) => {
          request
            .delete('/users/5')
            .set({
              Authorization: bearerToken[1]
            })
            .expect(403, done)
        })

        it('fails with 404 if user doesn\'t exist', (done) => {
          request
            .delete('/users/99')
            .set({
              Authorization: bearerToken[1]
            })
            .expect(404, done)
        })

        it('deletes an existing user', (done) => {
          request
            .delete('/users/3')
            .set({
              Authorization: bearerToken[3]
            })
            .expect(204, done())
          // TODO: Prüfen, dass der Server uns auch nicht anlügt.
          // Ist die Resource wirklich gelöscht? Problem: Token!
        })
      })

      describe('/groups', () => {
        before(async () => {
          await setup.resetData()
        })

        it('requires auth', (done) => {
          request
            .get('/users/1/groups')
            .expect(401, done)
        })

        it('fails if user tries to access another users groups', (done) => {
          request
            .get('/users/1/groups')
            .set({ Authorization: bearerToken[2] })
            .expect(403, done)
        })

        it('sends a correct group collection', (done) => {
          request
            .get('/users/1/groups')
            .set({ Authorization: bearerToken[1] })
            .expect(200)
            .expect(res => {
              let groups = res.body
              groups.should.be.an('array').of.length(1)

              let group = groups[0]
              group.should.have.property('id')
            })
            .end(done)
        })
      })
    })
  })
}