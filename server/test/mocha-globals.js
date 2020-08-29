const chai = require('chai')
const chaiSorted = require('chai-sorted')
const deepEqualInAnyOrder = require('deep-equal-in-any-order')

const testServer = require('./utils/test-server')

const knex = require('../src/knex')
const { connectToDatabase } = require('../src/util/util')

/**
 * Chai plugins
 */
chai.should()
chai.use(deepEqualInAnyOrder)
chai.use(chaiSorted)

/**
 * Global hooks.
 */
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
