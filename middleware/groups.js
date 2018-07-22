const Group = require('./../models').Group
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const User = require('./../models').User
const Lunchbreak = require('./../models').Lunchbreak
const Util = require('./../util/util')

module.exports = {
  loadGroup: async function (req, res, next) {
    try {
      res.locals.group = await Group.findOne({
        where: {
          id: req.params.groupId
        },
        include: [
          {
            model: Place,
            attributes: {
              exclude: ['groupId']
            },
            order: ['id']
          },
          {
            model: FoodType,
            attributes: {
              exclude: ['groupId']
            },
            order: ['id']
          },
          {
            model: Lunchbreak,
            limit: parseInt(req.query.lunchbreakLimit) || 25,
            order: ['id']
          },
          {
            model: User,
            as: 'members',
            through: {
              as: 'config',
              attributes: ['color', 'authorizationLevel']
            }
          }
        ]
      })
  
      if(!res.locals.group) {
        res.status(404).send()
      } else {
        next()
      }
    } catch (error) {
      next(error)
    }
  }
}