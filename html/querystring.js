/** parsed hash string (key-value pairs become object properties) */
const hs = Object.fromEntries(
	window.location.hash.substring(1)?.split('&').map(v => v.split('=')) ?? []);

/** parsed query string (key-value pairs become object properties) */
const qs = Object.fromEntries(
	window.location.href.split('?')[1]?.split('&').map(v => v.split('=')) ?? []);

export { hs, qs };
