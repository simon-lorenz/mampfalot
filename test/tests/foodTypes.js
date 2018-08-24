const setup = require('../setup')

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

			it('requires authentication', (done) => {
				request
					.post('/foodTypes')
					.send(updatedFoodType)
					.expect(401, done)
			})

			it('fails if user is no group admin', (done) => {
				request
					.post('/foodTypes')
					.set({ Authorization: bearerToken[2] })
					.send(updatedFoodType)
					.expect(403, done)
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

				it('requires authentication', (done) => {
					request
						.get('/foodTypes/1')
						.expect(401, done)
				})

				it('fails with 403 if user is no group member', (done) => {
					request
						.get('/foodTypes/1')
						.set({ Authorization: bearerToken[3] })
						.expect(403, done)
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
						.expect(403, done)
				})

				it('sends 400 if no type is specified', (done) => {
					request
						.post('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.send( { } )
						.expect(400, done)
				})

				it('fails if type already exists', (done) => {
					updatedFoodType.type = 'Döner'

					request
						.post('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.send(updatedFoodType)
						.expect(400, done)
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
						.expect(403, done)
					})

				it('deletes a foodType correctly', (done) => {
					request
						.delete('/foodTypes/1')
						.set({ Authorization: bearerToken[1] })
						.expect(204, done)
					})
			})
		})
	})
}