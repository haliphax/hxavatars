import constants from './constants.js';

/**
 * Asynchronously await a timeout.
 *
 * @param {number} ms The number of milliseconds to wait
 * @returns {Promise} An awaitable promise
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Generates a UUID.
 *
 * @returns {string} The UUID
 */
const uuid = () =>
	'xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx'.replace(/[^-]/g, c =>
		(c == 'x'
			? (crypto.getRandomValues(new Uint8Array(1))[0] & 15).toString(16)
			: (crypto.getRandomValues(new Uint8Array(1))[0] & 5).toString()));

export {
	delay,
	uuid,
};
