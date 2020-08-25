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

before(async () => {
	// Check database connection
	const max_tries = 5
	let tries = 1

	while (tries <= max_tries) {
		try {
			await knex.raw('SELECT 1+1 AS result')
			break
		} catch (error) {
			if (tries === max_tries) {
				console.error(`[Database] Connection could not be established: ${error}`)
				process.exit(1)
			} else {
				console.log(`[Database] Could not connect to database (${tries}/${max_tries}).`)
				tries++
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}
	}

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
