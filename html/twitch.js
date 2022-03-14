import { qs } from './querystring.js';

const twitch = new tmi.Client({
	options: { debug: true },
	channels: [qs.channel],
	identity: {
		username: qs.username,
		password: `oauth:${qs.oauth}`,
	},
});

const isBroadcaster = (tags) => tags.badges.hasOwnProperty('broadcaster');
const isModerator = (tags) => tags.mod;

export {
	isBroadcaster,
	isModerator,
	twitch,
};
