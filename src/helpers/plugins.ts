/**
 * The regext for finding the max-age value
 */
const CacheHeaderRegex = /^max-age=([0-9]+), public$/;

/**
 * Calculates the minimum max-age between the headers, retruns a new header
 *
 * @param {string[]} cacheControl - array of cache-control headers
 */
const calculateCacheHeader = (cacheControl = []) => {
	const maxAge = cacheControl
		.map((h) => CacheHeaderRegex.exec(h))
		.map((matches) => matches || [])
		.map((matches) => matches[1] || 0) // eslint-disable-line no-magic-numbers
		.reduce((acc, val) => Math.min(acc, val as any), +Infinity);

	return maxAge ? `max-age=${maxAge}, public` : 'no-cache';
};

/**
 * CacheControlHeaderPlugin
 *
 * Intended for use in conjunction with `CachedDataSource`.
 *
 * When used in an `ApolloGateway` with the `CachedDataSource`,
 * takes the generated array of `cacheControl` headers on the context
 * and calculates the minimum max-age of all the headers and then
 * sets that max-age on the response.
 *
 * This is intended to be used with federated schemas that return
 * `Cache-Control` headers, as supported by Apollo CacheControl.
 */
export const CacheControlHeaderPlugin = {
	requestDidStart() {
		return {
			willSendResponse({ response, context }) {
				const cacheHeader = calculateCacheHeader(
					context.cacheControl,
				);
				response.http.headers.set('Cache-Control', cacheHeader);
			},
		};
	},
};
