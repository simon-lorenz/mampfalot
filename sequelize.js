const Sequelize = require('sequelize')
const config = require('./config')

module.exports = new Sequelize(config.database.name, config.database.user, config.database.password, {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    operatorsAliases: Sequelize.Op // Vermeide Deprecation-Warnung
});
