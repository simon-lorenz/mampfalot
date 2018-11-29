const app = require('./app')
const PORT = process.env.PORT || 5000
const sequelize = require('./models').sequelize

app.listen(PORT, () => {
	console.log(`Launched in ${process.env.NODE_ENV} mode.`)
	console.log('Listening to port ' + PORT)
	console.log(`Trying to connect to ${process.env.DB_NAME} at ${process.env.DB_HOST} ...`)
	sequelize.authenticate()
		.then(() => console.log('Database connection successfully established.'))
		.catch((err) => {
			console.error('Database connection could not be established.')
			console.error(err.toString())
		})
})