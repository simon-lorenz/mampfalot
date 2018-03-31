let Util = {}

Util.isAdmin = function (req, res, next) {
    if (req.user.isAdmin) {
        next()
    } else {
        res.status(403).send({success: false, error: 'admin-privileges required'})
    }
}

module.exports = Util