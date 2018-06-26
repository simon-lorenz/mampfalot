process.env.NODE_ENV = 'test'

let request = require('supertest')('http://localhost:5001/api')
const app = require('./../app')
const setup = require('./data/setup')
const chai = require('chai')
chai.should()

describe('The mampfalot api', function () {
  let server
  let token = []
  this.timeout(10000)

  before(async () =>{
    await setup.setupDatabase()
    server = app.listen(5001)

    let res
    res = await request
      .get('/auth')
      .auth('mustermann@gmail.com', '123456')
    token['Mustermann'] = res.body.token

    res = await request
      .get('/auth')
      .auth('philipp.loten@company.com', 'password')
    token['Loten'] = res.body.token

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

  require('./tests/users')(request, token)
  require('./tests/auth')(request, token)
  require('./tests/groups')(request, token)
})