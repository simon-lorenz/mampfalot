const Boom = require('@hapi/boom')
const request = require('supertest')('http://localhost:5001')
const TokenHelper = require('../../test/utils/token-helper')
const testData = require('../knex/seeds')

describe('Lunchbreak', () => {
	describe('/groups/:groupId/lunchbreaks', () => {
		describe('GET', () => {
			it('requires query values from and to', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"from" is required. "to" is required',
						validation: {
							source: 'query',
							keys: ['from', 'to']
						}
					})
			})

			it('fails if from and to are not in the same year', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-01-01', to: '2019-01-01' })
					.expect(400)
					.expect(Boom.badRequest('The query values from and to have to be in the same year.').output.payload)
			})

			it('fails if from is greater than to', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-01-02', to: '2018-01-01' })
					.expect(400)
					.expect(Boom.badRequest('The given timespan is invalid.').output.payload)
			})

			it('fails if from is equal to', async () => {
				await request
					.get('/groups/1/lunchbreaks')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.query({ from: '2018-01-01', to: '2018-01-01' })
					.expect(400)
					.expect(Boom.badRequest('The given timespan is invalid.').output.payload)
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
			it('returns 404s', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-30')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(Boom.notFound().output.payload)
			})

			it("fails if user isn't a group member", async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
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

			it('includes participations of deleted members', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.participants.filter(p => p.member === null).should.have.lengthOf(0)
					})

				await request
					.delete('/groups/1/members/johndoe1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.participants.filter(p => p.member === null).should.have.lengthOf(1)
					})
			})
		})
	})
})
