let Util = {}

Util.isAdmin = function (req, res, next) {
    if (req.user.isAdmin) {
        next()
    } else {
        res.status(403).send({success: false, error: 'admin-privileges required'})
    }
}

Util.addKeyIfExists = function (from, to, key) {
    if (key in from) {
        to[key] = from[key]
    }
}

Util.missingValues = function (obj) {
    let undefinedKeys = []
    for (key in obj) {
        if (!obj[key]) {
            undefinedKeys.push(key)
        }
    }
    return undefinedKeys
}

module.exports = Util