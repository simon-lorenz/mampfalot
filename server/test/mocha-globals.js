/**
 * Ensure that the application knowns that it is tested.
 * This will affect expensive actions, like sending emails.
 */
process.env.NODE_ENV = 'test'

/**
 * Chai plugins
 */
const chai = require('chai')
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const chaiSorted = require('chai-sorted')
// const { before, beforeEach, after, afterEach } = require('mocha')

chai.use(deepEqualInAnyOrder)
chai.use(chaiSorted)

/**
 * Require the should style here so we don't need to do this in every single test file.
 */
require('chai').should()

/**
 * Global hooks.
 */
const testServer = require('./utils/test-server')
const knex = require('../src/knex')
const { connectToDatabase } = require('../src/util/util')

before(async () => {
	await connectToDatabase(5, require('pino')())
	await knex.migrate.rollback(true)
	await knex.migrate.latest()
})

beforeEach(async () => {
	await testServer.start()

	await knex.seed.run({
		directory: './src/knex/seeds',
		specific: 'seeder.js'
	})
})

afterEach(async () => {
	await testServer.stop()
})
