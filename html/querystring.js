const hs = Object.fromEntries(
	window.location.hash.substring(1)?.split('&').map(v => v.split('=')) ?? []);

const qs = Object.fromEntries(
	window.location.href.split('?')[1]?.split('&').map(v => v.split('=')) ?? []);

export { hs, qs };
