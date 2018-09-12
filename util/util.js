module.exports = {

	/**
	 * A wrapper for async middleware.
	 * Makes it possible to omit a lot try...catch statements inside async
	 * middleware because it catches every error automatically and routes it
	 * to the next error handling middleware.
	 */
	asyncMiddleware: (fn) => {
		return (req, res, next) => {
			Promise
				.resolve(fn(req, res, next))
				.catch(next);
		}
	}

}
