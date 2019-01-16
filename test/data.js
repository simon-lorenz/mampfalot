'use strict'

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
		},
		{
			id: 5,
			groupId: 2,
			type: 'Döööööner'
		}
	],
	groupMembers: [
		{
			groupId: 1,
			userId: 1,
			isAdmin: true,
			color: '#90ba3e'
		},
		{
			groupId: 1,
			userId: 2,
			isAdmin: false,
			color: '#24c4ee'
		},
		{
			groupId: 2,
			userId: 3,
			isAdmin: true,
			color: '#4e48ff'
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
	invitations: [
		{
			groupId: 1,
			fromId: 1,
			toId: 3
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
			voteEndingTime: '12:25:00',
			result: 1
		}
	],
	comments: [
		{
			id: 1,
			lunchbreakId: 1,
			userId: 1,
			comment: 'Dies ist ein erster Kommentar von Max Mustermann',
		},
		{
			id: 2,
			lunchbreakId: 1,
			userId: 1,
			comment: 'Dies ist ein zweiter Kommentar von Max Mustermann'
		},
		{
			id: 3,
			lunchbreakId: 1,
			userId: 2,
			comment: 'Dies der erste Kommentar von John Doe'
		}
	],
	participants: [
		{
			id: 1,
			userId: 1,
			lunchbreakId: 1
		},
		{
			id: 2,
			userId: 2,
			lunchbreakId: 1
		},
		{
			id: 3,
			userId: 3,
			lunchbreakId: 2
		}
	],
	votes: [
		{
			id: 1,
			participantId: 1,
			placeId: 2,
			points: 30
		},
		{
			id: 2,
			participantId: 1,
			placeId: 4,
			points: 30
		},
		{
			id: 3,
			participantId: 1,
			placeId: 3,
			points: 30
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
		},
		{
			id: 5,
			name: 'VIP-Döner',
			groupId: 2,
			foodTypeId: 5
		}
	],
	users: [
		{
			id: 1,
			username: 'maxmustermann',
			firstName: 'Max',
			lastName: 'Mustermann',
			email: 'mustermann@gmail.nonexistenttld',
			password: '123456',
			verified: true
		},
		{
			id: 2,
			username: 'johndoe1',
			firstName: 'John',
			lastName: 'Doe',
			email: 'john.doe@provider.nonexistenttld',
			password: 'supersafe',
			verified: true
		},
		{
			id: 3,
			username: 'loten',
			firstName: 'Philipp',
			lastName: 'Loten',
			email: 'philipp.loten@company.nonexistenttld',
			password: 'password',
			verified: true
		},
		{
			id: 4,
			username: 'björn_tietgen',
			firstName: 'Björn',
			lastName: 'Tietgen',
			email: 'björn.tietgen@gmail.nonexistenttld',
			password: 'test',
			verified: true
		},
		{
			id: 5,
			username: 'luisa-rogers',
			firstName: 'Luisa',
			lastName: 'Rogers',
			email: 'l.rogers@university.nonexistenttld',
			password: ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
			verified: true
		},
		{
			id: 6,
			username: 'alice',
			firstName: 'Alice',
			lastName: 'Jones',
			email: 'alice@jones.nonexistenttld',
			password: 'letmein',
			verified: true
		},
		{
			id: 7,
			username: 'to-be-verified',
			firstName: '',
			lastName: '',
			email: 'to-be-verified@email.nonexistenttld',
			password: 'verifyme',
			verified: false,
			verificationToken: '$2a$12$1tHI5g0IJm77KrvASnroLeLIHpQGzdCnU2.lZWqDsFCLPVrXTTfkW' // Hash of "valid-token"
		}
	]
}
