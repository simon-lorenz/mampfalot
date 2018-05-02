const jwt = require('jsonwebtoken')

module.exports = {
  validateToken: function(req, res, next) {
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
  }
}