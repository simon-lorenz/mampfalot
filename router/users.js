const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('./../models/user')
const Util = require('./../util/util')

router.route('/').get((req, res) => {
    User.findAll({
        attributes: {
            exclude: ['password']
        },
        order: [
            ['id', 'ASC']
        ]
    })
    .then(result => {
        res.send(result)
    })
    .catch(error => {
        res.status(400).send('Ein Fehler ist aufgetreten' + error)
    })
});

router.route('/edit').post(async function(req, res) {
    let updatedData = {}

    await addKeyIfExists(req.body, updatedData, 'name')
    await addKeyIfExists(req.body, updatedData, 'email')
    await addKeyIfExists(req.body, updatedData, 'password')

    // Trim Name und EMail
    if(updatedData.name) {
        updatedData.name = updatedData.name.trim()
    }

    if(updatedData.email)  {
        updatedData.email = updatedData.email.trim()
    }

    User.update(
        updatedData,
    { 
        where: {
            id: req.user.id
        }
    })
    .then(result => {
        // Unser User hat seine Daten geändert, jetzt braucht er ein neues JWT
        User.findOne({
            where: {
                id: req.user.id
            },
            raw: true
        })
        .then(user => {
            tokenData = user
            tokenData.password = undefined // Das Passwort bleibt schön hier
            let token = jwt.sign(tokenData, process.env.SECRET_KEY, {
                expiresIn: 4000
            })
            res.send({success: true, token})
        })
        .catch(err => {
            res.status(500).send({success: false, err: 'uh.oh'})
        })
    })
    .catch(error => {
        res.status(500).send({success: false, error})
    })
})

router.use('/register', Util.isAdmin)
router.route('/register').post((req, res) => {
    if (!(req.body.username && req.body.email && req.body.password)) {
        res.status(400).send({ success: false, error: 'Missing Values' })
        return
    }

    let username = req.body.username
    let email = req.body.email
    let password = req.body.password
    
    User.create({
        name: username, 
        email: email,
        password: password
    })
    .then(result => {
        res.send({success: true})
    })
    .catch(error => {
        res.send({success: false, error})
    })
})

function addKeyIfExists(from, to, key) {
    if (key in from) {
        to[key] = from[key]
    }
}

module.exports = router