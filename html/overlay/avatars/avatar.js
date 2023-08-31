import constants from "../../constants.js";

/** on-screen avatar with state machine */
class Avatar extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, avatarDefs, username, key, x) {
		super(scene, x, 0, key);
		this.setOrigin(0.5, 1).setScale(avatarDefs[key].metadata.scale);

		/** @type {string} The avatar owner's username */
		this.username = username;
		/** @type {string} The avatar's sprite name */
		this.key = key;
		/** @type {string} The direction the avatar's sprite is facing */
		this.face =
			Math.random() < constants.CHANCE_TO_CHANGE
				? constants.FACE_LEFT
				: constants.FACE_RIGHT;
		/**
		 * @type {number}
		 * Half the width of the avatar's sprite; used in calculations */
		this.halfWidth = this.displayWidth / 2;
		/** @type {number} The original label Y position */
		this.labelYPosition = -this.displayHeight - constants.LABEL_SIZE / 2;
		/** @type {Phase.GameObjects.Label} The username label for the avatar */
		this.label = this.scene.add
			.text(0, this.labelYPosition, username, {
				fontFamily: `"${constants.FONT_FAMILY}"`,
				fontSize: constants.LABEL_SIZE,
				stroke: constants.STROKE_COLOR,
				strokeThickness: constants.STROKE_THICKNESS,
			})
			.setOrigin(0.5, 1);
		/** The avatar's container, allowing us to manipulate a single object */
		this.container = this.scene.add.container();

		// startup
		this.label.avatar = this;
		this.label.container = this.container;
		this.label.overlapping = false;
		this.container.avatar = this;
		this.physicsReady();
		// needs this for it to be a "real" sprite
		scene.add.existing(this);
	}

	/** destroy avatar; stop state machine */
	destroy() {
		if (this.stateMachine) this.stateMachine.stateService.stop();

		this.cleanup();
	}

	/** called from destroy; actually destroy avatar once stopped */
	cleanup() {
		if (this.stateMachine.stateService.status !== 2)
			setTimeout(this.cleanup.bind(this), 100);

		this.label.destroy();
		super.destroy();
	}

	/** called from constructor to activate physics */
	physicsReady() {
		if (!this.scene.physics.world)
			return setTimeout(this.physicsReady.bind(this), 100);

		this.scene.physics.world.enableBody(this.label);
		this.scene.physics.world.enableBody(this.container);
		this.ready();
	}

	/** called from physicsReady to await physics */
	ready() {
		if (!this.container.body || !this.label.body)
			return setTimeout(this.ready.bind(this), 100);

		this.container.body.setSize(this.displayWidth, this.displayHeight, true);
		this.container.setSize(this.displayWidth, this.displayHeight, true);
		this.container.add(this);
		this.container.add(this.label);
		this.container.setPosition(
			Math.random() * (constants.SCREEN_WIDTH - this.displayWidth),
			constants.SCREEN_HEIGHT,
		);
	}

	/** update the avatar per animation frame */
	update() {
		if (!this.scene.spriteGroup || !this.container.body || !this.label.body)
			return;

		// raise/lower labels to avoid overlap

		const notThisLabel = this.scene.labelGroup.children.entries.filter(
			(l) => l != this,
		);

		const shouldRise = notThisLabel.some(
			(l) =>
				l.body.left <= this.label.body.right &&
				l.body.right >= this.label.body.left &&
				l.body.top < this.label.body.bottom + constants.LABEL_RISE_MARGIN &&
				(l.body.bottom > this.label.body.bottom ||
					(l.body.bottom == this.label.body.bottom &&
						l.body.x < this.label.body.x)),
		);

		const shouldFall =
			!shouldRise &&
			this.label.y < this.labelYPosition &&
			!notThisLabel.some(
				(l) =>
					l.body.left <= this.label.body.right &&
					l.body.right >= this.label.body.left &&
					l.body.top < this.label.body.bottom + constants.LABEL_FALL_MARGIN &&
					l.body.bottom > this.label.body.bottom,
			);

		if (shouldRise)
			this.label.body.setVelocityY(-constants.LABEL_FLOAT_VELOCITY);
		else if (shouldFall)
			this.label.body.setVelocityY(constants.LABEL_FLOAT_VELOCITY);
		else this.label.body.setVelocityY(0);

		if (this.label.y > this.labelYPosition)
			this.label.setPosition(this.label.x, this.labelYPosition);
	}

	// extensions

	/** flip the sprite's facing */
	changeFace() {
		this.face =
			this.face == constants.FACE_LEFT
				? constants.FACE_RIGHT
				: constants.FACE_LEFT;
		//console.debug(`facing ${this.face}`);
	}
}

export default Avatar;
