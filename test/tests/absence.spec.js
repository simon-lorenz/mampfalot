const setupDatabase = require('../utils/scripts/setup-database')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')
const testServer = require('../utils/test-server')
const Boom = require('@hapi/boom')

describe('Absence', () => {
	describe('/groups/:id/lunchbreaks/:date/absence', () => {
		describe('POST', () => {
			beforeEach(async () => {
				await setupDatabase()
				await testServer.start(5001, '11:24:59', '25.06.2018')
			})

			it('marks a user as absent', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => res.body)
					.then(lunchbreak => {
						lunchbreak.absent.should.be.deep.equal([testData.getGroupMember(1)])
					})
			})

			it('creates a lunchbreak if necessary', async () => {
				await testServer.start(5001, '11:24:59', '01.07.2018')

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.absent.should.be.deep.equal([testData.getGroupMember(1)])
					})
			})

			it('does not allow duplicates, but fails graciously', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await request
					.post('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => res.body)
					.then(lunchbreak => {
						lunchbreak.absent.should.be.deep.equal([testData.getGroupMember(1)])
					})
			})

			it('fails if the user is not a group member', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('removes a participation', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const lunchbreak = res.body
						if (lunchbreak.participants.find(p => p.member.username === 'maxmustermann')) {
							throw new Error('Participation was not deleted')
						}
					})
			})

			it('fails if voteEndingTime is reached', async () => {
				await testServer.start(5001, '11:24:59', '01.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await testServer.start(5001, '11:25:01', '01.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting has been reached, therefore you cannot mark yourself as absent.').output
							.payload
					)
			})

			it('fails if voteEndingTime is reached and no lunchbreak exists', async () => {
				await testServer.start(5001, '11:25:01', '01.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting has been reached, therefore you cannot mark yourself as absent.').output
							.payload
					)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('fails if the date lies in the past', async () => {
				await testServer.start(5001, '11:24:59', '02.07.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(Boom.badRequest('Absences can only be created for today.').output.payload)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)

				await request
					.get('/groups/1/lunchbreaks/2018-07-02')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('fails if the date lies in the future', async () => {
				await testServer.start(5001, '11:24:59', '30.06.2018')

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(Boom.badRequest('Absences can only be created for today.').output.payload)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)

				await request
					.get('/groups/1/lunchbreaks/2018-06-30')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await setupDatabase()
				await testServer.start(5001, '11:24:59', '25.06.2018')
			})

			it('removes an absence', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25/')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.then(res => res.body)
					.then(lunchbreak => lunchbreak.absent.should.be.an('array').with.lengthOf(0))
			})

			it('fails if user is no group member', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('alice'))
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('fails if voteEndingTime is reached', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await testServer.start(5001, '11:25:01', '25.06.2018')

				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(400)
					.expect(
						Boom.badRequest('The end of voting is reached, therefore you cannot delete this absence.').output.payload
					)
			})

			it('fails if the date lies in the past', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await testServer.start(5001, '11:24:59', '26.06.2018')

				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/absence')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(400)
					.expect(Boom.badRequest('You can only delete todays absence.').output.payload)
			})

			it('deletes the lunchbreak, if no other participants or comments exist', async () => {
				await testServer.start(5001, '11:24:59', '01.07.2018')

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)

				await request
					.post('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(201)

				await request
					.delete('/groups/1/lunchbreaks/2018-07-01/absence')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-07-01')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})
		})
	})
})
