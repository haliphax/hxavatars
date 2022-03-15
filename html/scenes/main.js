import constants from '../constants.js';
import emitter from '../emitter.js';
import WebFontFile from '../webfontfile.js';

/** avatar definitions and metadata */
const avatarDefs = {};
const avatarKeys = [];

// load and parse avatar definitions
await (async () => {
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
	});
})();

/** main game scene */
class MainScene extends Phaser.Scene {
	constructor() {
		super();

		this.avatars = {};
		this.labelGroup = this.labelCollider = this.spriteGroup = null;

		// event handlers
		emitter.on('change', this.onChange.bind(this));
		emitter.on('new', this.onNew.bind(this));
	}

	preload() {
		Object.keys(avatarDefs).map(k => avatarKeys.push(k));
		this.load.addFile(new WebFontFile(this.load, constants.FONT_FAMILY));

		for (let avatar of avatarKeys) {
			const def = avatarDefs[avatar];

			// load is relative to document
			this.load.spritesheet(avatar, `./avatars/${avatar}/avatar.png`, {
				frameHeight: def.metadata.frameHeight,
				frameWidth: def.metadata.frameWidth,
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
	}

	create() {
		this.spriteGroup = this.physics.add.group({
			bounceX: 1,
			bounceY: 1,
			collideWorldBounds: true,
		});
		this.labelGroup = this.physics.add.group();
		this.physics.world
			.setBounds(0, 0, constants.SCREEN_WIDTH, constants.SCREEN_HEIGHT)
			.setBoundsCollision(true, true, false, true);
	}

	update(time, delta) {
		for (let avatar of Object.values(this.avatars))
			avatar.update();
	}

	// events

	/** new avatar event */
	onNew(username, key = null) {
		if (this.avatars.hasOwnProperty(username))
			return;

		if (key === null)
			key = avatarKeys[Math.floor(Math.random() * avatarKeys.length)];
		else if (!avatarKeys.includes(key))
			return;

		this.avatars[username] =
			new avatarDefs[key].class(this, avatarDefs, username, key);
		this.spriteGroup.add(this.avatars[username].sprite);
		this.labelGroup.add(this.avatars[username].label);
	}

	/** change avatar event */
	onChange(username, key) {
		if (!avatarKeys.includes(key)) {
			console.log(avatarKeys);
			console.log(`No such key: ${key}`);
			return;
		}

		if (this.avatars.hasOwnProperty(username)) {
			const oldAvatar = this.avatars[username];
			const x = oldAvatar.container.x;

			this.spriteGroup.remove(oldAvatar.sprite);
			this.labelGroup.remove(oldAvatar.label);
			oldAvatar.destroy();
			delete this.avatars[username];
			this.onNew(username, key);

			this.avatars[username].container.x = x;
		}
		else
			this.onNew(username, key);
	}
}

export default MainScene;
