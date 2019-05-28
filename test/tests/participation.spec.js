const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const testServer = require('../utils/test-server')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')

describe('Participation', () => {

	describe('/users/me/participations', () => {

		describe('GET', () => {
			it('requires from and to query values', async () => {
				await request
					.get('/users/me/participations/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						errorHelper.checkRequiredQueryValues(res.body, ['from', 'to'], true)
					})
			})

			it('fails if from is greater or equal than to', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The given timespan is invalid.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})

				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-02', to: '2018-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The given timespan is invalid.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})
			})

			it('fails if from and to are not in the same year', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-12-31', to: '2019-01-01' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const expectedMessage = 'The query values from and to have to be in the same year.'
						errorHelper.checkRequestError(res.body, expectedMessage)
					})
			})

			it('from and to should be inclusive')

			it('sends a correct collection of participations', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-01-01', to: '2018-12-31' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						res.body.should.be.deep.equal(testData.getParticipationsOf('maxmustermann', 1))
					})
			})
		})

	})

	describe('/groups/:groupId/lunchbreaks/:date/participation', () => {

		describe('POST', () => {
			beforeEach(async () => {
				testServer.start(5001, '11:24:59', '25.06.2018')
				await setupDatabase()
			})

			it('requires body values votes, result and amountSpent', async () => {
				await request
					.post('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.then(res => {
						errorHelper.checkRequiredBodyValues(res.body, ['amountSpent', 'result', 'votes'], true)
					})
			})

			it('accepts null for result and amountSpent')

			it('todo: vote checks...')
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				testServer.start(5001, '11:24:59', '25.06.2018')
				await setupDatabase()
			})

			it('fails if the voteEndingTime is reached', async () => {
				testServer.start(5001, '12:25:01', '25.06.2018')
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(400)
					.expect(res => {
						const MESSAGE = 'The end of voting has been reached, therefore this participation cannot be deleted.'
						errorHelper.checkRequestError(res.body, MESSAGE)
					})
			})

			it('deletes a participant successfully', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => {
						const lunchbreak = res.body
						const max = lunchbreak.participants.find(participant => {
							participant.member.username === 'maxmustermann'
						})

						if (max)
							throw new Error('The participation was not deleted.')
					})
			})

			it('does not delete the associated lunchbreak', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('does not delete the associated user', async () => {
				await request
					.delete('/groups/1/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('deletes associated lunchbreak if no participants left', async () => {
				await request
					.delete('/groups/2/lunchbreaks/2018-06-25/participation')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(204)

				await request
					.get('/groups/2/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(404)
			})
		})

	})

})
