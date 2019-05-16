/**
 * Ensure that the application knowns that it is tested.
 * This will affect expensive actions, like sending emails.
 */
process.env.NODE_ENV = 'test'

/**
 * Require the should style here so we don't need to do this in every single test file.
 */
require('chai').should()

/**
 * Global hooks.
 */
const testServer = require('./utils/test-server')
const setupDatabase = require('./utils/scripts/setup-database')

before(async () => {
	await setupDatabase()
})

after(async () => {
	await setupDatabase()
})

beforeEach(() => {
	testServer.start(5001)
})

afterEach(() => {
	testServer.close()
})
