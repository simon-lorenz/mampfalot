const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('./../models/user')

router.route('/').get((req, res) => {
    let authHeader = req.headers['authorization']

    if (!authHeader) {
        res.status(400).send({ success: false, error: 'Missing Authorization-Header'})
        return
    } 
    
    // Header-Aufbau: 'Basic <base64String>'
    // Wir wollen nur den b64-String und splitten deshalb beim Leerzeichen
    let credentialsB64 = authHeader.split(' ')[1]
    let credentials = new Buffer(credentialsB64, 'base64').toString('ascii') // Enthält nun username:password
    let username = credentials.split(':')[0]
    let password = credentials.split(':')[1]

    User.findOne({
        where: {
            name: username
        },
        raw: true
    })
    .then(user => {
        if (!user) {
            res.status(401).send({ success: false, error: 'Invalid Credentials'})
        } else {
            // Ein User wurde gefunden, vergleiche das Passwort
            if (bcrypt.compareSync(password, user.password)) {
                // Passwort korrekt - generiere Token
                tokenData = user
                tokenData.password = undefined // Das Passwort bleibt schön hier

                let token = jwt.sign(tokenData, process.env.SECRET_KEY, {
                    expiresIn: '10h'
                })
                res.send({success: true, token})
            } else {
                // Password inkorrekt
                res.status(401).send({success: false, error: 'Invalid Credentials'})
            }
        }
    })
    .catch(error => {
        res.status(500).send(error)
    })
});

module.exports = router