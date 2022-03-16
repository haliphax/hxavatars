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

export { uuid };
