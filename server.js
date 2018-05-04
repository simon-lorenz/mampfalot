require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const auth = require('./util/auth')
const PORT = process.env.PORT || 5000

app.use(cors())

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({
    extended: false
}))

app.get('/', (req, res) => {
    res.send({ message: 'This is the mampfalot-api! Please authenticate yourself for data access.'})
})

// Router
const router = {
    auth: require('./router/authenticationRouter'),
    places: require('./router/placesRouter'),
    foodTypes: require('./router/foodTypesRouter'),
    users: require('./router/userRouter'),
    votes: require('./router/votesRouter')
}

app.use('/api/auth', router.auth)
app.use('/api/places', auth.validateToken, router.places)
app.use('/api/foodTypes', auth.validateToken, router.foodTypes)
app.use('/api/users', auth.validateToken, router.users)
app.use('/api/votes', auth.validateToken, router.votes)

// Globaler Exception-Handler
app.use((err, req, res, next) => {
    if (!err) {
        return next();
    } else {
        console.log(err)
        res.status(500).send('500: Internal server error')
    }
});

app.listen(PORT, () => {    
    console.log('Listening to port ' + PORT);
});