import constants from '../../constants.js';
import emitter from '../emitter.js';
import WebFontFile from '../webfontfile.js';

const avatarDefs = {};
const avatarKeys = [];

// fetch is relative to document
await fetch('./config.json').then(r => r.json()).then(async d => {
	for (let avatar of d.avatars) {
		//console.debug(`importing ${avatar}`);

		// import is relative to script
		await import(`../avatars/${avatar}/avatar.js`).then(m => {
			//console.debug(`defining ${avatar}`);
			avatarDefs[avatar] = {
				metadata: m.metadata,
				class: m.ExtendedAvatar,
			};
		});
	}

	Object.keys(avatarDefs).map(k => avatarKeys.push(k));
});

class DirectorScene extends Phaser.Scene {
	constructor() {
		super('director');

		this.currentScene = 'main';
		this.avatars = {};

		// event handlers
		emitter.on('change-avatar', this.onChangeAvatar.bind(this));
		emitter.on('new-avatar', this.onNewAvatar.bind(this));
	}

	preload() {
		this.load.addFile(new WebFontFile(this.load, constants.FONT_FAMILY));

		for (let avatar of avatarKeys) {
			const def = avatarDefs[avatar];
			const extras = (def.metadata.hasOwnProperty('extruded')
				&& def.metadata.extruded)
					? { margin: 1, spacing: 2 }
					: { /* empty */ };

			// load is relative to document
			this.load.spritesheet(avatar, `./avatars/${avatar}/avatar.png`, {
				frameHeight: def.metadata.frameHeight,
				frameWidth: def.metadata.frameWidth,
				...extras,
			});
		}

		this.load.on('complete', this.ready.bind(this));
	}

	ready() {
		console.log('ready');

		for (let avatar of avatarKeys) {
			//console.debug(`initializing ${avatar}`);

			const def = avatarDefs[avatar];

			for (let animKey of Object.keys(def.metadata.animations)) {
				const anim = def.metadata.animations[animKey];

				for (let variation of
					Object.keys(anim).filter(v => v != 'frameRate'))
				{
					const key = `${avatar}.${animKey}.${variation}`;

					//console.debug(`creating ${key}`);
					this.anims.create({
						key: key,
						frames: this.anims.generateFrameNumbers(
							avatar, { frames: anim[variation] }),
						frameRate: anim.frameRate,
						repeat: -1,
					});
				}
			}
		}

		this.scene.start(this.currentScene);
	}

	// events

	/** change avatar event */
	onChangeAvatar(username, key) {
		if (!avatarKeys.includes(key)) {
			console.log(avatarKeys);
			console.log(`No such key: ${key}`);
			return;
		}

		if (this.avatars.hasOwnProperty(username)) {
			const oldAvatar = this.avatars[username];
			const containerX = oldAvatar.container.x;
			const labelY = oldAvatar.label.y;

			oldAvatar.destroy();
			delete this.avatars[username];
			this.onNewAvatar(username, key);

			const newAvatar = this.avatars[username];

			newAvatar.container.x = containerX;
			newAvatar.label.y = labelY;
		}
		else {
			this.onNewAvatar(username, key);
		}
	}

	/** new avatar event */
	onNewAvatar(username, key = null) {
		if (this.avatars.hasOwnProperty(username))
			return;

		if (key === null || key == undefined)
			key = avatarKeys[Math.floor(Math.random() * avatarKeys.length)];
		else if (!avatarKeys.includes(key))
			return;

		this.avatars[username] = new avatarDefs[key].class(
			this.game.scene.keys[this.currentScene], avatarDefs, username, key);

		// add new avatar to scenes
		emitter.emit('register-avatar', this.avatars[username]);
	}
}

export default DirectorScene;
