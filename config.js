'use strict'

function loadConfig() {
	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = 'development'
	}

	switch (process.env.NODE_ENV) {
		case 'production':
			require('dotenv').load()
			break

		case 'development':
			process.env.DB_DIALECT = 'mysql'
			process.env.DB_HOST = 'localhost'
			process.env.DB_NAME = 'mampfalot_test'
			process.env.DB_PASSWORD = 'root'
			process.env.DB_PORT = 3306
			process.env.DB_USER = 'root'
			process.env.FRONTEND_BASE_URL = 'http://localhost:4200'
			process.env.MAIL_HOST = ''
			process.env.MAIL_PASSWORD_HELLO = ''
			process.env.MAIL_PASSWORD_SUPPORT = ''
			process.env.MAIL_PORT = 465
			process.env.SECRET_KEY = '123456'
			break

		case 'test':
			process.env.DB_DIALECT = 'mysql'
			process.env.DB_HOST = 'localhost'
			process.env.DB_NAME = 'mampfalot_test'
			process.env.DB_PASSWORD = 'root'
			process.env.DB_PORT = 3306
			process.env.DB_USER = 'root'
			process.env.SECRET_KEY = '123456'
			break

		default:
			throw new Error('Unkown NODE_ENV!')
	}
}

module.exports = loadConfig()
