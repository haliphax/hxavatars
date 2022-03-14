import constants from './constants.js';
import emitter from './emitter.js';
import WebFontFile from './webfontfile.js';

const avatarDefs = {};

await (async () => {
	await fetch('./config.json').then(r => r.json()).then(async d => {

		for (let avatar of d.avatars) {
			//console.debug(`importing ${avatar}`);

			await import(`./avatars/${avatar}/avatar.js`).then(m => {
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
class Game extends Phaser.Scene {
	constructor() {
		super();

		this.avatars = {};
		this.labelGroup = this.labelCollider = null;

		// event handlers
		emitter.on('new', this.onNew.bind(this));
	}

	preload() {
		this.load.addFile(new WebFontFile(this.load, constants.FONT_FAMILY));

		for (let avatar of Object.keys(avatarDefs)) {
			const def = avatarDefs[avatar];

			this.load.spritesheet(avatar, `./avatars/${avatar}/avatar.gif`, {
				frameHeight: def.metadata.frameHeight,
				frameWidth: def.metadata.frameWidth,
			});
		}

		this.load.on('complete', this.ready.bind(this));
	}

	ready() {
		console.log('ready');

		for (let avatar of Object.keys(avatarDefs)) {
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
		this.labelGroup = this.physics.add.group();
		this.labelCollider = this.physics.add.collider(
			this.labelGroup, this.labelGroup, this.onLabelOverlap.bind(this));
		this.physics.world
			.setBounds(0, 0, constants.SCREEN_WIDTH, constants.SCREEN_HEIGHT)
			.setBoundsCollision(true, true, false, true);
	}

	update(time, delta) {
		for (let avatar of Object.values(this.avatars))
			avatar.update();
	}

	// events

	onLabelOverlap(a, b) {
		a.overlapping = (a.container.x < b.container.x || a.y < b.y);
		/**
		 * TODO: This prevents them from floating forever, but results in some
		 * unresolved overlaps. Would be better to check and see if there is
		 * empty space below the label first.
		 */
		b.overlapping = !a.overlapping;
	}

	onNew(username, key = 'mario') {
		if (this.avatars.hasOwnProperty(username))
			return;

		this.avatars[username] =
			new avatarDefs[key].class(this, avatarDefs, username, key);
		this.labelGroup.add(this.avatars[username].label);
	}
}

export default Game;
