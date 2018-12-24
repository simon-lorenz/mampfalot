function loadConfig() {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development'
  }

  switch (process.env.NODE_ENV) {
    case 'production':
      require('dotenv').load()
      break

    case 'development':
      process.env.DB_DIALECT = 'mysql',
      process.env.DB_HOST = 'localhost',
      process.env.DB_NAME = 'mampfalot_dev',
      process.env.DB_PASSWORD = '',
      process.env.DB_PORT = 3306,
      process.env.DB_USER = '',
      process.env.SECRET_KEY = '123456'
      break

    case 'test':
      process.env.DB_DIALECT = 'mysql',
      process.env.DB_HOST = 'localhost',
      process.env.DB_NAME = 'mampfalot_test',
      process.env.DB_PASSWORD = '',
      process.env.DB_PORT = 3306,
      process.env.DB_USER = '',
      process.env.SECRET_KEY = '123456'
      break;

    default:
      throw 'Unkown NODE_ENV!'
  }
}

module.exports = loadConfig()