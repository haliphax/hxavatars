import constants from '../constants.js';
import emitter from './emitter.js';
import { hs } from '../util.js';
import { twitchClient } from './twitch.js';
// scenes
import DirectorScene from './scenes/director.js';
import MainScene from './scenes/main.js';

if (!hs.hasOwnProperty('oauth') && !hs.hasOwnProperty('demo'))
	window.location = constants.OAUTH_URL;

const options = {
	height: constants.SCREEN_HEIGHT,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false,
			gravity: {
				y: (hs.gravity || constants.GRAVITY),
			},
		},
	},
	pixelArt: true,
	render: {
		transparent: (hs.hasOwnProperty('demo') ? false : true),
	},
	scene: [DirectorScene, MainScene],
	type: Phaser.AUTO,
	width: constants.SCREEN_WIDTH,
};

/** Phaser game instance */
const game = new Phaser.Game(options);

/** which chatters already have avatars */
const avatars = {};

/** late-bound Twitch connection */
const twitch = twitchClient();

if (hs.hasOwnProperty('oauth')) {
	/** regex for parsing commands from chat messages */
	const commandRgx = /^(\![-_.a-z0-9]+)(?:\s+(.+))?$/i;

	twitch.on('message', (channel, tags, message, self) => {
		if (self)
			return;

		// add avatar for chatter if they don't have one
		if (!avatars.hasOwnProperty(tags['display-name'])) {
			avatars[tags['display-name']] = true;
			// TODO: remember selection from before
			emitter.emit('new-avatar', tags['display-name']);
		}

		const cmd = commandRgx.exec(message);

		if (!cmd) return;

		/** command being executed */
		const command = cmd[1].toLowerCase().substring(1);
		/** string of command arguments (if any) */
		const args = cmd[2];

		console.log(`Command: ${command}`);
		console.log(`Args: ${args}`);

		// TODO: command timeouts

		switch (command) {
			case 'avatar':
				emitter.emit('change-avatar', tags['display-name'], args);
				break;
		}
	});

	twitch.connect();
}

// Avatars for testing/demonstration
if (hs.hasOwnProperty('demo')) {
	let howMany = 20;

	try {
		howMany = parseInt(hs.demo)
	}
	catch {
		//
	}

	setTimeout(() =>
		{
			for (let i = 1; i <= howMany; i++) {
				if (i % 100 === 0)
					console.log(`Avatar #${i}`);

				emitter.emit('new-avatar', `Avatar#${i}`);
			}
		},
		1000);
}

// for debugging
window.game = game;
