const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')

describe('Lunchbreak', () => {

	describe('/groups/:groupId/lunchbreaks', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('requires query values from and to', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						errorHelper.checkRequiredQueryValues(res.body, ['from', 'to'], true)
					})
			})

			it('fails if from and to are not in the same year', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-01-01', to: '2019-01-01' })
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The query values from and to have to be in the same year.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})
			})

			it('fails if from is greater than to', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-01-02', to: '2018-01-01' })
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The given timespan is invalid.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})
			})

			it('fails if from is equal to', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-01-01', to: '2018-01-01' })
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The given timespan is invalid.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})
			})

			it('treats the query dates as inclusive values', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-06-25', to: '2018-06-26' })
					.expect(200)
					.expect(res => {
						res.body.should.be.an('array').with.lengthOf(2)
					})
			})

			it('sends a valid lunchbreak collection', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-01-01', to: '2018-12-31' })
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getLunchbreaks(1))
					})
			})
		})
	})

	describe('/groups/:groupId/lunchbreaks/:date', () => {
		describe('GET', () => {
			before(async() => {
				await setupDatabase()
			})

			it('returns NotFoundError', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-30')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Lunchbreak', null)
					})
			})

			it('fails if user isn\'t a group member', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Lunchbreak',
							id: 1,
							operation: 'READ'
						}

						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('sends a correct lunchbreak resource', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getLunchbreak(1, '2018-06-25'))
						res.body.comments.should.be.sortedBy('createdAt', { descending: true })
					})

				await request
					.get('/groups/2/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getLunchbreak(2, '2018-06-25'))
						res.body.comments.should.be.sortedBy('createdAt', { descending: true })
					})

				await request
					.get('/groups/1/lunchbreaks/2018-06-26')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						res.body.should.be.equalInAnyOrder(testData.getLunchbreak(1, '2018-06-26'))
						res.body.comments.should.be.sortedBy('createdAt', { descending: true })
					})
			})
		})
	})

})
