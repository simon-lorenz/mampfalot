const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/places', () => {
		describe('POST', () => {
			let newPlace

			beforeEach(async () => {
				newPlace = { name: 'new place', groupId: 1, foodTypeId: 1 }
				await setup.resetData()
			})

			it('requires group admin rights', (done) => {
				request
					.post('/places')
					.set({ Authorization: bearerToken[2] })
					.send(newPlace)
					.expect(403)
					.expect(res => {
						let expectedError = {
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
						let message = 'This request has to provide all of the following body values: groupId, foodTypeId, name'
						errorHelper.checkRequestError(res.body, message)
					})
					.end(done)
			})

			it('fails if the foodTypeId doesn\'t belong to the group', (done) => {
				newPlace.foodTypeId = 5
				request
					.post('/places')
					.set({ Authorization: bearerToken[1] })
					.send(newPlace)
					.expect(400)
					.expect(res => {
						let expectedError = {
								field: 'foodTypeId',
								value: newPlace.foodTypeId,
								message: 'This food type does not belong to group ' + newPlace.groupId
							}
						errorHelper.checkValidationError(res.body, expectedError)
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
						let place = res.body
						place.should.have.property('id')
						place.should.have.property('groupId').equals(newPlace.groupId)
						place.should.have.property('foodTypeId').equals(newPlace.foodTypeId)
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
							errorHelper.checkNotFoundError(res.body, 'Place', '99')
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
							let place = res.body
							place.should.have.property('id').equals(1)
							place.should.have.property('groupId').equals(1)
							place.should.have.property('foodTypeId').equals(2)
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
						foodTypeId: 2
					}
				})

				it('requires group admin rights', (done) => {
					request
						.post('/places/1')
						.set({ Authorization: bearerToken[2] })
						.send(updatedPlace)
						.expect(403)
						.expect(res => {
							let expectedError = {
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
							let place = response.body
							place.should.have.property('id')
							place.should.have.property('name').equal(updatedPlace.name)
							place.should.have.property('foodTypeId').equal(updatedPlace.foodTypeId)
							place.should.have.property('groupId').equal(1)
						})
						.end(done)
				})

				it('sends 400 on non-group foreign key', (done) => {
					updatedPlace.foodTypeId = 5 // this id belongs to group 2
					request
						.post('/places/1')
						.set({ Authorization: bearerToken[1] })
						.send(updatedPlace)
						.expect(400)
						.expect(res => {
							let expectedError = {
								field: 'foodTypeId',
								value: updatedPlace.foodTypeId,
								message: 'This food type does not belong to group 1'
							}
							errorHelper.checkValidationError(res.body, expectedError)
						})
						.end(done)
				})

				it('sends 400 if no name and foodTypeId is provided', (done) => {
					request
						.post('/places/1')
						.set({ Authorization: bearerToken[1] })
						.send( {} )
						.expect(400)
						.expect(res => {
							errorHelper.checkRequestError(res.body)
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
							let expectedError = {
								resource: 'Place',
								id: 1,
								operation: 'DELETE'
							}
							errorHelper.checkAuthorizationError(res.body)
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

				it('does not delete associated foodType', async () => {
					await request
						.delete('/places/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/foodTypes/2')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
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
							let lunchbreak = res.body
							lunchbreak.should.have.property('result').equal(null)
						})
				})
			})
		})
	})
}
