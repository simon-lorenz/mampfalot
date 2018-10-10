const setup = require('../setup')
const errorHelper = require('../helpers/errors')

module.exports = (request, bearerToken) => {
	return describe('/foodTypes', () => {
		describe('POST', () => {
			let updatedFoodType

			beforeEach(async () => {
				updatedFoodType = {
					groupId: 1,
					type: 'New food type'
				}
				await setup.resetData()
			})

			it('fails if user is no group admin', (done) => {
				request
					.post('/foodTypes')
					.set({ Authorization: bearerToken[2] })
					.send(updatedFoodType)
					.expect(403)
					.expect(res => {
						let expectedError = {
							resource: 'FoodType',
							operation: 'CREATE',
							message: 'You do not have the necessary permissions for this operation.'
						}
						errorHelper.checkAuthorizationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if type is missing', (done) => {
				updatedFoodType.type = undefined
				request
					.post('/foodTypes')
					.set({ Authorization: bearerToken[1] })
					.send(updatedFoodType)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'type',
							value: null,
							message: 'type cannot be null.'
						}

						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if type is empty', (done) => {
				updatedFoodType.type = ''
				request
					.post('/foodTypes')
					.set({ Authorization: bearerToken[1] })
					.send(updatedFoodType)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'type',
							value: updatedFoodType.type,
							message: 'type cannot be empty.'
						}

						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('fails if type already exists', (done) => {
				updatedFoodType.type = 'Döner',
				request
					.post('/foodTypes')
					.set({ Authorization: bearerToken[1] })
					.send(updatedFoodType)
					.expect(400)
					.expect(res => {
						let expectedError = {
							field: 'type',
							value: updatedFoodType.type,
							message: 'This type already exists for this group.'
						}

						errorHelper.checkValidationError(res.body, expectedError)
					})
					.end(done)
			})

			it('inserts a duplicate foodType for a different group', async () => {
				await request
					.post('/foodTypes')
					.set({ Authorization: bearerToken[3] })
					.send({ groupId: 2, type: 'Asiatisch' })
					.expect(200)
			})

			it('inserts a new foodType correctly', (done) => {
				request
					.post('/foodTypes')
					.set({ Authorization: bearerToken[1] })
					.send(updatedFoodType)
					.expect(200)
					.expect(res => {
						let foodType = res.body
						foodType.should.have.property('id')
						foodType.should.have.property('groupId').equal(updatedFoodType.groupId)
						foodType.should.have.property('type').equal(updatedFoodType.type)
					})
					.end(done)
			})
		})

		describe('/:foodTypeId', () => {
			describe('GET', () => {
				before(async () => {
					await setup.resetData()
				})

				it('returns NotFoundError', (done) => {
					request
						.get('/foodTypes/99')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
						.expect(res => {
							errorHelper.checkNotFoundError(res.body, 'FoodType', 99)
						})
						.end(done)
				})

				it('fails with 403 if user is no group member', (done) => {
					request
						.get('/foodTypes/1')
						.set({ Authorization: bearerToken[3] })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'FoodType',
								id: 1,
								operation: 'READ',
								message: 'You do not have the necessary permissions for this operation.'
							}

							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('sends a correct foodType resource', (done) => {
					request
						.get('/foodTypes/1')
						.set({ Authorization: bearerToken[2] })
						.expect(200)
						.expect(res => {
							let foodType = res.body
							foodType.should.have.property('id').equal(1)
							foodType.should.have.property('type').equal('Asiatisch')
						})
						.end(done)
				})
			})

			describe('POST', () => {
				let updatedFoodType

				beforeEach(async () => {
					updatedFoodType = {
						type: 'Geändert!'
					}
					await setup.resetData()
				})

				it('requires admin rights', (done) => {
					request
						.post('/foodTypes/1')
						.set({ Authorization: bearerToken[2] })
						.send(updatedFoodType)
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'FoodType',
								id: 1,
								operation: 'UPDATE',
								message: 'You do not have the necessary permissions for this operation.'
							}

							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
				})

				it('sends 400 if body is empty', (done) => {
					request
						.post('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.send({ })
						.expect(400)
						.expect(res => {
							errorHelper.checkRequestError(res.body)
						})
						.end(done)
				})

				it('fails if type already exists', (done) => {
					updatedFoodType.type = 'Döner'

					request
						.post('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.send(updatedFoodType)
						.expect(400)
						.expect(res => {
							let expectedError = {
								field: 'type',
								value: updatedFoodType.type,
								message: 'This type already exists for this group.'
							}

							errorHelper.checkValidationError(res.body, expectedError)
						})
						.end(done)
				})

				it('updates a new foodType correctly', (done) => {
					request
						.post('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.send(updatedFoodType)
						.expect(200)
						.expect(response => {
							let foodType = response.body
							foodType.should.have.property('id')
							foodType.should.have.property('type').equal(updatedFoodType.type)
						})
						.end(done)
				})
			})

			describe('DELETE', () => {
				beforeEach(async() => {
					await setup.resetData()
				})

				it('requires group admin rights', (done) => {
					request
						.delete('/foodTypes/1')
						.set({ Authorization: bearerToken[2] })
						.expect(403)
						.expect(res => {
							let expectedError = {
								resource: 'FoodType',
								id: 1,
								operation: 'DELETE',
								message: 'You do not have the necessary permissions for this operation.'
							}

							errorHelper.checkAuthorizationError(res.body, expectedError)
						})
						.end(done)
					})

				it('deletes a foodType correctly', async () => {
					await request
						.delete('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(404)
				})

				it('does not delete the associated group', async () => {
					await request
						.delete('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/groups/1')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
				})

				it('sets the foreign key of associated places to null', async () => {
					await request
						.delete('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204)

					await request
						.get('/places/2')
						.set({ Authorization: bearerToken[1] })
						.expect(200)
						.expect(res => {
							let place = res.body
							place.should.have.property('foodTypeId').equal(null)
						})
				})
			})
		})
	})
}
