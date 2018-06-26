const app = require('./app')
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
	console.log('Running in ' + process.env.NODE_ENV + ' mode.')
	console.log('Database: ' + process.env.DB_NAME)
	console.log('Listening to port ' + PORT)
})