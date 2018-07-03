const Place = require('../models').Place
const Sequelize = require('sequelize')

module.exports = {
  async loadPlace(req, res, next) {
    try {
      res.locals.place = await Place.findOne({
        where: {
          id: req.params.placeId
        }
      })
  
      if (!res.locals.place) {
        res.status(404).send()
      } else {
        res.locals.group = { id: res.locals.place.groupId } 
        next()
      }
    } catch (error) {
      next(error)
    }
  },
  async createPlace(req, res, next) {
    try {
      let newPlace = await Place.create({
        groupId: req.body.groupId,
        name: req.body.name
      })
      res.send(newPlace)
    } catch (error) {
      next(error)
    }
  }
}