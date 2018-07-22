const fs = require('fs')
const path = require('path');
const basename = path.basename(__filename);
const Sequelize = require('sequelize')

let db = {}

let sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT,
  logging: false,
  dialectOptions: {
    multipleStatements: true
  },
  operatorsAliases: Sequelize.Op // Vermeide Deprecation-Warnung
})

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js')
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, file))
    db[model.name] = model
})

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }

  if(db[modelName].loadScopes) {
    db[modelName].loadScopes(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db