const Boom = require('@hapi/boom')
const setupDatabase = require('../utils/scripts/setup-database')
const request = require('supertest')('http://localhost:5001')
const TokenHelper = require('../utils/token-helper')
const testData = require('../utils/scripts/test-data')

describe('Place', () => {
	describe('/groups/:groupId/places', () => {
		describe('POST', () => {
			let newPlace

			beforeEach(async () => {
				newPlace = { name: 'new place', foodType: 'Italian' }
				await setupDatabase()
			})

			it('requires group admin rights', async () => {
				await request
					.post(`/groups/1/places`)
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(newPlace)
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('requires body values', async () => {
				await request
					.post(`/groups/1/places`)
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({})
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"foodType" is required. "name" is required',
						validation: {
							source: 'payload',
							keys: ['foodType', 'name']
						}
					})
			})

			it('fails if the foodType is empty', async () => {
				newPlace.foodType = ''
				await request
					.post(`/groups/1/places`)
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(newPlace)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"foodType" is not allowed to be empty',
						validation: {
							source: 'payload',
							keys: ['foodType']
						}
					})
			})

			it('fails if the name is empty', async () => {
				newPlace.name = ''
				await request
					.post(`/groups/1/places`)
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(newPlace)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"name" is not allowed to be empty',
						validation: {
							source: 'payload',
							keys: ['name']
						}
					})
			})

			it('fails if the name is a duplicate', async () => {
				newPlace.name = 'AsiaFood'
				await request
					.post(`/groups/1/places`)
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(newPlace)
					.expect(400)
					.expect(Boom.badRequest('A place with this name already exists').output.payload)
			})

			it('inserts new place correctly', async () => {
				await request
					.post(`/groups/1/places`)
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(newPlace)
					.expect(201)
					.expect(res => {
						const place = res.body
						place.should.have.all.keys(testData.getPlaceKeys())
						place.should.have.property('id')
						place.should.have.property('foodType').equals(newPlace.foodType)
						place.should.have.property('name').equals(newPlace.name)
					})
			})
		})
	})

	describe('/groups/:groupId/places/:placeId', () => {
		describe('PUT', () => {
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
					.put('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.send(updatedPlace)
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('updates a new place correctly', async () => {
				await request
					.put('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(updatedPlace)
					.expect(200)
					.expect(response => {
						const place = response.body
						place.should.have.all.keys(testData.getPlaceKeys())
						place.should.have.property('id')
						place.should.have.property('name').equal(updatedPlace.name)
						place.should.have.property('foodType').equal(updatedPlace.foodType)
					})
			})

			it('sends 400 if no name and foodType is provided', async () => {
				await request
					.put('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send({})
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"foodType" is required. "name" is required',
						validation: {
							source: 'payload',
							keys: ['foodType', 'name']
						}
					})
			})

			it('fails if the foodType is empty', async () => {
				updatedPlace.foodType = ''
				await request
					.put('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(updatedPlace)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"foodType" is not allowed to be empty',
						validation: {
							source: 'payload',
							keys: ['foodType']
						}
					})
			})

			it('fails if the name is empty', async () => {
				updatedPlace.name = ''
				await request
					.put('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(updatedPlace)
					.expect(400)
					.expect({
						statusCode: 400,
						error: 'Bad Request',
						message: '"name" is not allowed to be empty',
						validation: {
							source: 'payload',
							keys: ['name']
						}
					})
			})

			it('fails if the name is a duplicate', async () => {
				updatedPlace.name = 'AsiaFood'
				await request
					.put('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.send(updatedPlace)
					.expect(400)
					.expect(Boom.badRequest('A place with this name already exists').output.payload)
			})
		})

		describe('DELETE', () => {
			beforeEach(async () => {
				await setupDatabase()
			})

			it('requires group admin rights', async () => {
				await request
					.delete('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('johndoe1'))
					.expect(403)
					.expect(Boom.forbidden('Insufficient scope').output.payload)
			})

			it('deletes a place successfully', async () => {
				await request
					.delete('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.then(res => {
						if (res.body.places.find(place => place.id === 1)) {
							throw new Error('Place with id 1 was not deleted.')
						}
					})
			})

			it('deletes all votes associated with this place', async () => {
				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const placeExists = res.body.participants[0].votes.find(vote => vote.place.id === 2)

						if (!placeExists) {
							throw new Error('Wrong setup, place does not exist.')
						}
					})

				await request
					.delete('/groups/1/places/2')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1/lunchbreaks/2018-06-25')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(res => {
						const placeExists = res.body.participants[0].votes.find(vote => vote.place.id === 2)

						if (placeExists) {
							throw new Error('Votes were not deleted.')
						}
					})
			})

			it('does not delete the associated group', async () => {
				await request
					.delete('/groups/1/places/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/groups/1')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
			})

			it('sets associated participation results to null', async () => {
				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-06-24', to: '2018-06-25' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const participation = res.body.find(p => p.date === '2018-06-25')
						participation.should.have.property('result').not.eql(null)
					})

				await request
					.delete('/groups/1/places/4')
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(204)

				await request
					.get('/users/me/participations/1')
					.query({ from: '2018-06-24', to: '2018-06-25' })
					.set(await TokenHelper.getAuthorizationHeader('maxmustermann'))
					.expect(200)
					.expect(res => {
						const participation = res.body.find(p => p.date === '2018-06-25')
						participation.should.have.property('result').eql(null)
					})
			})
		})
	})
})
