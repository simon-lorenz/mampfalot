const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('./../models/user')
const auth = require('./../util/auth')

router.route('/').get((req, res) => {
    let credentials
    try {
        credentials = auth.decodeBasicAuthorizationHeader(req)
    } catch (error) {
        res.status(400).send({ error })
        return
    }

    User.findOne({
        where: {
            name: credentials.username
        },
        raw: true
    })
    .then(user => {
        if (!user) {
            res.status(401).send({ success: false, error: 'Invalid Credentials'})
        } else {
            // Ein User wurde gefunden, vergleiche das Passwort
            if (bcrypt.compareSync(credentials.password, user.password)) {
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