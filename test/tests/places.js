'use strict'

const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/places', () => {
		describe('POST', () => {
			let newPlace

			beforeEach(async () => {
				newPlace = { name: 'new place', groupId: 1, foodType: 'Italian' }
				await setup.resetData()
			})

			it('requires group admin rights', (done) => {
				request
					.post('/places')
					.set({ Authorization: bearerToken[2] })
					.send(newPlace)
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Place',
							id: null,
							operation: 'CREATE'
						}
						errorHelper.checkAuthorizationError(res.body,expectedError)
					})
					.end(done)
			})

			it('requires body values', (done) => {
				request
					.post('/places')
					.set({ Authorization: bearerToken[1] })
					.send({})
					.expect(400)
					.expect(res => {
						const message = 'This request has to provide all of the following body values: groupId, foodType, name'
						errorHelper.checkRequestError(res.body, message)
					})
					.end(done)
			})

			it('inserts new place correctly', (done) => {
				request
					.post('/places')
					.set({ Authorization: bearerToken[1] })
					.send(newPlace)
					.expect(200)
					.expect(res => {
						const place = res.body
						place.should.have.property('id')
						place.should.have.property('groupId').equals(newPlace.groupId)
						place.should.have.property('foodType').equals(newPlace.foodType)
						place.should.have.property('name').equals(newPlace.name)
					})
					.end(done)
			})
		})

		describe('/:placeId', () => {
			describe('GET', () => {
				before(async () => {
					await setup.resetData()
				})

				it('returns NotFoundError', (done) => {
					request
						.get('/places/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'Place', 99)
						})
						.end(done)
				})

				it('fails if user is no group member', (done) => {
					request
						.get('/places/1')
						.set({ Authorization: bearerToken[3] })
						.expect(403)
						.expect(res => {
							errorHelper.checkAuthorizationError(res.body)
						})
						.end(done)
				})

				it('sends 404 if resource does\'t exist', (done) => {
					request
						.get('/places/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404, done)
				})

				it('responds with a correct place resource', (done) => {
					request
						.get('/places/1')
						.set({ Authorization: bearerToken[2] })
						.expect(200)
						.expect(res => {
							const place = res.body
							place.should.have.property('id').equals(1)
							place.should.have.property('groupId').equals(1)
							place.should.have.property('foodType').equals('Döner')
							place.should.have.property('name').equals('VIP-Döner')
						})
						.end(done)
				})
			})

			describe('POST', () => {
				let updatedPlace

				beforeEach(async () => {
					await setup.resetData()
					updatedPlace = {
						name: 'updated',
						foodType: 'updatedFoodType'
					}
				})

				it('requires group admin rights', (done) => {
					request
						.post('/places/1')
						.set({ Authorization: bearerToken[2] })
						.send(updatedPlace)
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'Place',
								id: updatedPlace.id,
								operation: 'UPDATE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('updates a new place correctly', (done) => {
					request
						.post('/places/1')
						.set({ Authorization: bearerToken[1] })
						.send(updatedPlace)
						.expect(200)
						.expect(response => {
							const place = response.body
							place.should.have.property('id')
							place.should.have.property('name').equal(updatedPlace.name)
							place.should.have.property('foodType').equal(updatedPlace.foodType)
							place.should.have.property('groupId').equal(1)
						})
						.end(done)
				})

				it('sends 400 if no name and foodType is provided', (done) => {
					request
						.post('/places/1')
						.set({ Authorization: bearerToken[1] })
						.send( {} )
						.expect(400)
						.expect(res => {
							const message = 'This request has to provide at least one of the following body values: foodType, name'
							errorHelper.checkRequestError(res.body, message)
						})
						.end(done)
				})
			})

			describe('DELETE', () => {
				beforeEach(async () => {
					await setup.resetData()
				})

				it('requires group admin rights', (done) => {
					request
						.delete('/places/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							const expectedError = {
								resource: 'Place',
								id: 1,
								operation: 'DELETE'
							}
							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('deletes a place successfully', async () => {
					await request
						.delete('/places/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/places/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})

				it('deletes all votes associated with this place', async () => {
					await request
						.delete('/places/2')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/votes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})

				it('does not delete the associated group', async () => {
					await request
						.delete('/places/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
				})

				it('sets associated lunchbreak results to null', async () => {
					await request
						.delete('/places/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/lunchbreaks/3')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							const lunchbreak = res.body
							lunchbreak.should.have.property('result').equal(null)
						})
				})
			})
		})
	})
}
