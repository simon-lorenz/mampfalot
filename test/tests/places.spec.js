const setupDatabase = require('../utils/scripts/setup-database')
const errorHelper = require('../utils/errors')
const request = require('supertest')('http://localhost:5001/api')
const TokenHelper = require('../utils/token-helper')

describe('/places', () => {
	describe('POST', () => {
		let newPlace

		beforeEach(async () => {
			newPlace = { name: 'new place', groupId: 1, foodType: 'Italian' }
			await setupDatabase()
		})

		it('requires group admin rights', async () => {
			await request
				.post('/places')
				.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
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
		})

		it('requires body values', async () => {
			await request
				.post('/places')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send({})
				.expect(400)
				.expect(res => {
					const message = 'This request has to provide all of the following body values: groupId, foodType, name'
					errorHelper.checkRequestError(res.body, message)
				})
		})

		it('fails if the foodType is empty', async () => {
			newPlace.foodType = ''
			await request
				.post('/places')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newPlace)
				.expect(400)
				.expect(res => {
					const expectedError = {
						field: 'foodType',
						value: newPlace.foodType,
						message: 'foodType cannot be empty.'
					}
					errorHelper.checkValidationError(res.body, expectedError)
				})
		})

		it('inserts new place correctly', async () => {
			await request
				.post('/places')
				.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
				.send(newPlace)
				.expect(200)
				.expect(res => {
					const place = res.body
					place.should.have.property('id')
					place.should.have.property('groupId').equals(newPlace.groupId)
					place.should.have.property('foodType').equals(newPlace.foodType)
					place.should.have.property('name').equals(newPlace.name)
				})
		})
	})

	describe('/:placeId', () => {
		describe('GET', () => {
			before(async () => {
				await setupDatabase()
			})

			it('returns NotFoundError', async () => {
				await request
					.get('/places/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
					.expect(res => {
						errorHelper.checkNotFoundError(res.body, 'Place', 99)
					})
			})

			it('fails if user is no group member', async () => {
				await request
					.get('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('loten'))
					.expect(403)
					.expect(res => {
						errorHelper.checkAuthorizationError(res.body)
					})
			})

			it('sends 404 if resource does\'t exist', async () => {
				await request
					.get('/places/99')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('responds with a correct place resource', async () => {
				await request
					.get('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(200)
					.expect(res => {
						const place = res.body
						place.should.have.property('id').equals(1)
						place.should.have.property('groupId').equals(1)
						place.should.have.property('foodType').equals('Döner')
						place.should.have.property('name').equals('VIP-Döner')
					})
			})
		})

		describe('POST', () => {
			let updatedPlace

			beforeEach(async () => {
				await setupDatabase()
				updatedPlace = {
					name: 'updated',
					foodType: 'updatedFoodType'
				}
			})

			it('requires group admin rights', async () => {
				await request
					.post('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
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
			})

			it('updates a new place correctly', async () => {
				await request
					.post('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(updatedPlace)
					.expect(200)
					.expect(response => {
						const place = response.body
						place.should.have.property('id')
						place.should.have.property('name').equal(updatedPlace.name)
						place.should.have.property('foodType').equal(updatedPlace.foodType)
						place.should.have.property('groupId').equal(1)
					})
			})

			it('sends 400 if no name and foodType is provided', async () => {
				await request
					.post('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send( {} )
					.expect(400)
					.expect(res => {
						const message = 'This request has to provide at least one of the following body values: foodType, name'
						errorHelper.checkRequestError(res.body, message)
					})
			})

			it('allows patching', async () => {
				updatedPlace.foodType = undefined
				await request
					.post('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(updatedPlace)
					.expect(200)
					.expect(res => {
						const place = res.body
						place.should.have.property('name').equal(updatedPlace.name)
						place.should.have.property('foodType').equal('Döner')
					})
			})

			it('fails if the foodType is empty', async () => {
				updatedPlace.foodType = ''
				await request
					.post('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(updatedPlace)
					.expect(400)
					.expect(res => {
						const expectedError = {
							field: 'foodType',
							value: updatedPlace.foodType,
							message: 'foodType cannot be empty.'
						}
						errorHelper.checkValidationError(res.body, expectedError)
					})
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('requires group admin rights', async () => {
				await request
					.delete('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(res => {
						const expectedError = {
							resource: 'Place',
							id: 1,
							operation: 'DELETE'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
			})

			it('deletes a place successfully', async () => {
				await request
					.delete('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('deletes all votes associated with this place', async () => {
				await request
					.delete('/places/2')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/votes/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(404)
			})

			it('does not delete the associated group', async () => {
				await request
					.delete('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('sets associated lunchbreak results to null', async () => {
				await request
					.delete('/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/lunchbreaks/3')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const lunchbreak = res.body
						lunchbreak.should.have.property('result').equal(null)
					})
			})
		})
	})
})
