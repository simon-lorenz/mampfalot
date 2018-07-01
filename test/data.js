module.exports = {
	foodTypes: [
		{
			id: 1,
			groupId: 1,
			type: 'Asiatisch'
		},
		{
			id: 2,
			groupId: 1,
			type: 'Döner'
		},
		{
			id: 3,
			groupId: 1,
			type: 'Fast-Food'
		},
		{
			id: 4,
			groupId: 1,
			type: 'Italienisch'
		}
	],
	groupMembers: [
		{
			groupId: 1,
			userId: 1,
			authorizationLevel: 1,
			color: '90ba3e'
		},
		{
			groupId: 1,
			userId: 2, 
			authorizationLevel: 0,
			color: '24c4ee'
		}
	],
	groups: [
		{
			id: 1, 
			name: 'Group_1',
			defaultLunchTime: '12:30:00',
			defaultVoteEndingTime: '12:25:00',
			pointsPerDay: 100,
			maxPointsPerVote: 70,
			minPointsPerVote: 30
		},
		{
			id: 2, 
			name: 'Group_2',
			defaultLunchTime: '13:00:00',
			defaultVoteEndingTime: '12:59:00',
			pointsPerDay: 10,
			maxPointsPerVote: 6,
			minPointsPerVote: 2
		},
		{
			id: 3, 
			name: 'Group_3',
			defaultLunchTime: '12:00:00',
			defaultVoteEndingTime: '11:55:00',
			pointsPerDay: 3,
			maxPointsPerVote: 1,
			minPointsPerVote: 1
		}
	],
	lunchbreaks: [
		{
			id: 1,
			groupId: 1,
			date: '2018-06-25',
			lunchTime: '12:30:00',
			voteEndingTime: '12:25:00'
		},
		{
			id: 2, 
			groupId: 2,
			date: '2018-06-25',
			lunchTime: '13:00:00',
			voteEndingTime: '12:59:00'
		},
		{
			id: 3,
			groupId: 1,
			date: '2018-06-26',
			lunchTime: '12:30:00',
			voteEndingTime: '12:25:00'
		}
	],
	places: [
		{
			id: 1,
			name: 'VIP-Döner',
			groupId: 1,
			foodTypeId: 2
		},
		{
			id: 2,
			name: 'AsiaFood',
			groupId: 1,
			foodTypeId: 1
		},
		{
			id: 3,
			name: 'Mc Donald\'s',
			groupId: 1,
			foodTypeId: 3
		},
		{
			id: 4,
			name: 'L\'Osteria',
			groupId: 1,
			foodTypeId: 4
		}
	],
	users: [
		{
			id: 1,
			name: 'Max Mustermann',
			email: 'mustermann@gmail.com',
			password: '123456'
		},
		{
			id: 2,
			name: 'John Doe',
			email: 'john.doe@provider.com',
			password: 'supersafe'
		},
		{
			id: 3,
			name: 'Philipp Loten',
			email: 'philipp.loten@company.com',
			password: 'password'
		},
		{
			id: 4,
			name: 'Todd Adams',
			email: 'adams11@gmail.com',
			password: 'test'
		},
		{
			id: 5,
			name: 'Luisa Rogers',
			email: 'l.rogers@university.edu',
			password: 'access'
		},
		{
			id: 6,
			name: 'Alice Jones',
			email: 'alice@jones.com',
			password: 'letmein'
		}
	]
}