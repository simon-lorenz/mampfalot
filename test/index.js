process.env.NODE_ENV = 'test'

let request = require('supertest')('http://localhost:5001/api')
const app = require('./../app')
const setup = require('./setup')
const users = require('./data').users
const chai = require('chai')
chai.should()

describe('The mampfalot api', function () {
  let server
  let bearerToken = []
  this.timeout(10000)

  before(async () =>{
    await setup.initialize()
    await setup.resetData()
    server = app.listen(5001)

    let res
    for (user of users) {
      res = await request
        .get('/auth')
        .auth(user.email, user.password)
      bearerToken[user.id] = 'Bearer ' + res.body.token
    }
    
    server.close()
  })

  beforeEach(async () => {
    server = app.listen(5001)    
  })

  afterEach((done) => {
    server.close()
    done()
  })

  it('responds to /', (done) => {
    request
      .get('/')
      .expect(200, done)
  })

  it('404s unkown routes', (done) => {
    request
      .get('/foo')
      .expect(404, done)
  })

  require('./tests/users')(request, bearerToken)
  require('./tests/auth')(request, bearerToken)
  require('./tests/groups')(request, bearerToken)
  require('./tests/foodTypes')(request, bearerToken)
})