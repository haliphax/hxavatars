import constants from './constants.js';
import emitter from './emitter.js';
import MainScene from './scenes/main.js';
import { qs } from './querystring.js';
import { twitch } from './twitch.js';

if (!qs.hasOwnProperty('oauth'))
	window.location = constants.OAUTH_URL;

/** main Phaser.Game instance */
const game = new Phaser.Game({
	height: constants.SCREEN_HEIGHT,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false,
			gravity: {
				y: (qs.gravity || constants.GRAVITY),
			},
		},
	},
	pixelArt: true,
	render: {
		transparent: (qs.hasOwnProperty('demo') ? false : true),
	},
	scene: [MainScene],
	type: Phaser.AUTO,
	width: constants.SCREEN_WIDTH,
});

/** which chatters already have avatars */
const avatars = {};

/** regex for parsing commands from chat messages */
const commandRgx = /^(\![-_.a-z0-9]+)(?:\s+(.+))?$/i;

twitch.on('message', (channel, tags, message, self) => {
	// add avatar for chatter if they don't have one
	if (!avatars.hasOwnProperty(tags['display-name'])) {
		avatars[tags['display-name']] = true;
		// TODO: remember selection from before
		emitter.emit('new', tags['display-name']);
	}

	const cmd = commandRgx.exec(message);

	if (self || !cmd) return;

	/** command being executed */
	const command = cmd[1].toLowerCase().substring(1);
	/** string of command arguments (if any) */
	const args = cmd[2];

	// TODO: command timeouts

	switch (command) {
		// TODO: commands
	}
});

twitch.connect();

// Avatars for testing/demonstration
if (qs.hasOwnProperty('demo'))
	setTimeout(() =>
		{
			for (let i = 1; i <= 20; i++) {
				if (i % 100 === 0)
					console.log(`Avatar #${i}`);

				emitter.emit('new', `Avatar#${i}`);
			}
		},
		1000);

// for debugging
window.game = game;
