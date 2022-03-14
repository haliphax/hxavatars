import { qs } from './querystring.js';

/** Twitch client */
const twitch = new tmi.Client({
	options: { debug: true },
	channels: [qs.channel],
	identity: {
		username: qs.username,
		password: `oauth:${qs.oauth}`,
	},
});

/** based on tags, is this user the broadcaster? */
const isBroadcaster = (tags) => tags.badges.hasOwnProperty('broadcaster');
/** based on tags, is this user a moderator? */
const isModerator = (tags) => tags.mod;

export {
	isBroadcaster,
	isModerator,
	twitch,
};
