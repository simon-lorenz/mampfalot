'use strict'

const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false
})

const models = {}

fs
	.readdirSync(__dirname)
	.filter(file => file.indexOf('.') !== 0)
	.filter(file => file.slice(-3) === '.js')
	.filter(file => file !== path.basename(__filename))
	.forEach(file => {
		const pathToModel = path.join(__dirname, file)
		const model = sequelize.import(pathToModel)
		models[model.name] = model
	})

Object
	.keys(models)
	.forEach(modelName => {
		if (models[modelName].associate)
			models[modelName].associate(models)
	})

module.exports = {
	sequelize,
	...models
}
