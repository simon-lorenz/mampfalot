const Group = require('./../models').Group
const FoodType = require('./../models').FoodType
const Place = require('./../models').Place
const User = require('./../models').User
const Lunchbreak = require('./../models').Lunchbreak
const Util = require('./../util/util')

module.exports = {
  findAllGroups: function (req, res, next) {
    Group.findAll({
			where: {
				id: { in: Util.getGroupIds(res.locals.user, false)
				}
			},
			include: [
				Place,
				FoodType,
				Lunchbreak,
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
		.then(groups => {
			res.send(groups)
		})
  },
  loadGroup: function (req, res, next) {
    Group.findOne({
      where: {
        id: req.params.groupId
      },
      include: [
        {
          model: Place,
          attributes: {
            exclude: ['foodTypeId', 'groupId']
          },
          include: [ FoodType ]
        },
        {
          model: FoodType,
          attributes: {
            exclude: ['groupId']
          }
        },
        {
          model: Lunchbreak,
          limit: parseInt(req.query.lunchbreakLimit) || 25
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
    .then(group => {
      if (group) {
        res.locals.group = group
        next()
      } else {  
        res.status(404).send()
      }   
    })
    .catch(err => {
      console.log(err)
      res.status(500).send()
    })
  }
}