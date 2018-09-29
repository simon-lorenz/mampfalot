const ENDPOINTS = [
	{
		url: '/auth',
		methods: ['GET'],
		public: true
	},
	{
		url: '/comments/1',
		methods: ['GET', 'POST', 'DELETE'],
		public: false
	},
	{
		url: '/foodTypes',
		methods: ['POST'],
		public: false
	},
	{
		url: '/foodTypes/1',
		methods: ['GET', 'POST', 'DELETE'],
		public: false
	},
	{
		url: '/groups',
		methods: ['GET', 'POST'],
		public: false
	},
	{
		url: '/groups/1',
		methods: ['GET', 'POST', 'DELETE'],
		public: false
	},
	{
		url: '/groups/1/lunchbreaks',
		methods: ['GET', 'POST'],
		public: false
	},
	{
		url: '/groups/1/members',
		methods: ['GET', 'POST'],
		public: false
	},
	{
		url: '/groups/1/members/1',
		methods: ['POST', 'DELETE'],
		public: false
	},
	{
		url: '/groups/1/places',
		methods: ['GET', 'POST'],
		public: false
	},
	{
		url: '/groups/1/foodTypes',
		methods: ['GET', 'POST']
	},
	{
		url: '/lunchbreaks/1',
		methods: ['GET', 'POST'],
		public: false
	},
	{
		url: '/lunchbreaks/1/comments',
		methods: ['GET', 'POST'],
		public: false
	},
	{
		url: '/lunchbreaks/1/participants',
		methods: ['GET', 'POST'],
		public: false
	},
	{
		url: '/participants/1',
		methods: ['GET', 'DELETE'],
		public: false
	},
	{
		url: '/participants/1/votes',
		methods: ['GET'],
		public: false
	},
	{
		url: '/places',
		methods: ['POST'],
		public: false
	},
	{
		url: '/places/1',
		methods: ['GET', 'POST', 'DELETE'],
		public: false
	},
	{
		url: '/users',
		methods: ['GET', 'POST'],
		public: true
	},
	{
		url: '/users/password-reset',
		methods: ['GET', 'POST'],
		public: true
	},
	{
		url: '/users/1',
		methods: ['GET', 'POST', 'DELETE'],
		public: false
	},
	{
		url: '/users/1/groups',
		methods: ['GET'],
		public: false
	},
	{
		url: '/votes',
		methods: ['POST'],
		public: false
	},
	{
		url: '/votes/1',
		methods: ['GET', 'DELETE'],
		public: false
	}
]

module.exports = {
	getAll() {
		return ENDPOINTS
	},
	getProtected() {
		let protectedEndpoints = []
		for (let endpoint of ENDPOINTS) {
			if (!endpoint.public) {
				protectedEndpoints.push(endpoint)
			}
		}
		return protectedEndpoints
	},
	getPublic() {
		let publicEndpoints = []
		for (let endpoint of ENDPOINTS) {
			if (endpoint.public) {
				publicEndpoints.push(endpoint)
			}
		}
		return publicEndpoints
	}
}
