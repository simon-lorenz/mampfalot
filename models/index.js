'use strict'

const fs = require('fs')
const path = require('path')
const basename = path.basename(__filename)
const Sequelize = require('sequelize')

const db = {}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false
})

fs
	.readdirSync(__dirname)
	.filter(file => {
		return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
	})
	.forEach(file => {
		const model = sequelize['import'](path.join(__dirname, file))
		db[model.name] = model
	})

Object.keys(db).forEach(modelName => {
	if (db[modelName].associate)
		db[modelName].associate(db)

	if(db[modelName].loadScopes)
		db[modelName].loadScopes(db)
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
