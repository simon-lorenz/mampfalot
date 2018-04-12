require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const cors = require('cors')
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
const authenticationRouter = require('./router/authenticationRouter')
const placesRouter = require('./router/placesRouter')
const foodTypesRouter = require('./router/foodTypesRouter')
const userRouter = require('./router/userRouter')
const votesRouter = require('./router/votesRouter')

app.use('/api/auth', authenticationRouter)

// Token-Validation
app.use((req, res, next) => {
    let bearerHeader = req.headers['authorization']

    if (bearerHeader) {
        const bearerToken = bearerHeader.split(' ')[1];

        jwt.verify(bearerToken, process.env.SECRET_KEY, (err, decoded) => {
          if (err) {
            res.status(401).send('Invalid token');
          } else {
            req.user = decoded // Speichere Userdaten im Request-Objekt
            next()
          }
        })
    } else {
        res.status(401).send('Invalid token')
    }
})

app.use('/api/places', placesRouter)
app.use('/api/foodTypes', foodTypesRouter)
app.use('/api/users', userRouter)
app.use('/api/votes', votesRouter)

app.listen(PORT, () => {    
    console.log('Listening to port ' + PORT);
});