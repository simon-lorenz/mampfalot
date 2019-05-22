module.exports = {
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
			lunchTime: '12:30:00',
			voteEndingTime: '12:25:00',
			utcOffset: 60,
			pointsPerDay: 100,
			maxPointsPerVote: 70,
			minPointsPerVote: 30
		},
		{
			id: 2,
			name: 'Group_2',
			lunchTime: '13:00:00',
			voteEndingTime: '12:59:00',
			utcOffset: -120,
			pointsPerDay: 10,
			maxPointsPerVote: 6,
			minPointsPerVote: 2
		},
		{
			id: 3,
			name: 'Group_3',
			lunchTime: '12:00:00',
			voteEndingTime: '11:55:00',
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
			date: '2018-06-25'
		},
		{
			id: 2,
			groupId: 2,
			date: '2018-06-25'
		},
		{
			id: 3,
			groupId: 1,
			date: '2018-06-26',
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
			foodType: 'Döner'
		},
		{
			id: 2,
			name: 'AsiaFood',
			groupId: 1,
			foodType: 'Asiatisch'
		},
		{
			id: 3,
			name: 'Mc Donald\'s',
			groupId: 1,
			foodType: 'Fast-Food'
		},
		{
			id: 4,
			name: 'L\'Osteria',
			groupId: 1,
			foodType: 'Italienisch'
		},
		{
			id: 5,
			name: 'VIP-Döner',
			groupId: 2,
			foodType: 'Döner'
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
	],
	getGroup: function (id) {
		// console.log(this.groups)
		const group = this.groups.find(group => group.id === id)

		group.members = []
		const members = this.groupMembers.filter(member => member.groupId === id)
		members.forEach(member => group.members.push(this.getGroupMember(member.groupId, member.userId)))

		group.places = []
		const places = this.places.filter(place => place.groupId === id)
		places.forEach(place => group.places.push(this.getPlace(place.id)))

		return group
	},
	getGroupsOfUser: function (userId) {
		const memberships = this.groupMembers.filter(member => member.userId === userId)
		const result = []
		memberships.forEach(membership => result.push(this.getGroup(membership.groupId)))
		return result
	},
	getInvitationsOfUser: function (userId) {
		const invitations = this.invitations.filter(invitation => invitation.toId === userId)
		return invitations.map(invitation => {
			return {
				from: this.getUser(invitation.fromId),
				to: this.getUser(invitation.toId),
				group: this.getGroup(invitation.groupId)
			}
		})
	},
	getGroupKeys: function() {
		return Object.keys(this.getGroup(1))
	},
	getGroupMemberKeys: function() {
		return Object.keys(this.getGroupMember(1, 1))
	},
	getUserKeys: function() {
		return Object.keys(this.getUser(1))
	},
	getPlaceKeys: function() {
		return Object.keys(this.getPlace(1))
	},
	getUserKeysWithEmail: function() {
		return Object.keys(this.getUserWithEmail(1))
	},
	getPassword(username) {
		return this.users.find(user => user.username === username).password
	},
	getGroupMember: function(groupId, userId) {
		const member = this.groupMembers.find(member => member.userId === userId && member.groupId === groupId)
		const user = this.getUser(userId)
		return {
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			config: {
				color: member.color,
				isAdmin: member.isAdmin
			}
		}
	},
	getVote: function(voteId) {
		const vote = this.votes.find(vote => vote.id === voteId)
		return {
			id: vote.id,
			points: vote.points,
			place: this.getPlace(vote.placeId)
		}
	},
	getVotesOfParticipant: function(participantId) {
		const votes = this.votes.filter(vote => vote.participantId === participantId)
		return votes.map(vote => this.getVote(vote.id))
	},
	getAllGroupMembers: function(groupId) {
		const members = this.groupMembers.filter(member => member.groupId === groupId)
		return members.map(member => {
			return this.getGroupMember(member.groupId, member.userId)
		})
	},
	getLunchbreaks: function(groupId) {
		const lunchbreaks = this.lunchbreaks.filter(lunchbreak => lunchbreak.groupId === groupId)
		return lunchbreaks.map(lunchbreak => this.getLunchbreak(lunchbreak.groupId, lunchbreak.date))
	},
	getGroupIdForLunchbreak: function(lunchbreakId) {
		return this.lunchbreaks.find(lunchbreak => lunchbreak.id === lunchbreakId).groupId
	},
	getParticipant: function(userId, lunchbreakId) {
		const participant = this.participants.find(participant => participant.userId === userId && participant.lunchbreakId === lunchbreakId)
		const groupId = this.getGroupIdForLunchbreak(participant.lunchbreakId)
		return {
			member: this.getGroupMember(groupId, participant.userId),
			votes: this.getVotesOfParticipant(participant.id)
		}
	},
	getParticipants: function(lunchbreakId) {
		const participants = this.participants.filter(participant => participant.lunchbreakId === lunchbreakId)
		return participants.map(participant => this.getParticipant(participant.userId, participant.lunchbreakId))
	},
	getLunchbreak: function(groupId, date) {
		const lunchbreak = this.lunchbreaks.find(lunchbreak => lunchbreak.groupId === groupId && lunchbreak.date === date)
		return {
			id: lunchbreak.id,
			date: lunchbreak.date,
			participants: this.getParticipants(lunchbreak.id),
			absent: [],
			responseless: this.getAllGroupMembers(lunchbreak.groupId),
			comments: this.getCommentsOfLunchbreak(lunchbreak.id)
		}
	},
	getCommentsOfLunchbreak: function(lunchbreakId) {
		const comments = this.comments.filter(comment => comment.lunchbreakId === lunchbreakId)
		return comments.map(comment => this.getComment(comment.id))
	},
	getComment: function(commentId) {
		const comment = this.comments.find(comment => comment.id === commentId)
		const groupId = this.getGroupIdForLunchbreak(comment.lunchbreakId)
		return {
			id: comment.id,
			text: comment.comment,
			author: this.getGroupMember(groupId, comment.userId)
			// TODO Timestamps?
		}
	},
	getUser: function(userId) {
		const user = this.users.find(user => user.id === userId)
		return {
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName
		}
	},
	getUserWithEmail: function (userId) {
		const user = this.users.find(user => user.id === userId)
		return {
			username: user.username,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email
		}
	},
	getPlace: function(placeId) {
		const place = this.places.find(place => place.id === placeId)
		return {
			id: place.id,
			name: place.name,
			foodType: place.foodType
		}
	},
	getInvitations: function(groupId) {
		const invitations = this.invitations.filter(invitation => invitation.groupId === groupId)
		return invitations.map(invitation => {
			return {
				from: this.getUser(invitation.fromId),
				to: this.getUser(invitation.toId),
				group: this.getGroup(invitation.groupId)
			}
		})
	}
}

