import { createMachine, interpret }
	from 'https://unpkg.com/xstate@4/dist/xstate.web.js';
import constants from './constants.js';
import { uuid } from './util.js';

/** on-screen avatar with state machine */
class Avatar {
	constructor(scene, avatarDefs, username, key = 'mario') {
		/** @type {Phaser.Scene} The current scene */
		this.scene = scene;
		/** @type {string} The avatar owner's username */
		this.username = username;
		/** @type {string} The avatar's sprite name */
		this.key = key;
		/** @type {string} The direction the avatar's sprite is facing */
		this.face = Math.random() < constants.CHANCE_TO_CHANGE
			? constants.FACE_LEFT
			: constants.FACE_RIGHT;
		/** @type {Phaser.GameObjects.Sprite} The avatar's sprite */
		this.sprite = this.scene.physics.add.sprite(0, 0, key)
			.setOrigin(0.5, 1)
			.setScale(avatarDefs[key].metadata.scale);
		/**
		 * @type {number}
		 * Half the width of the avatar's sprite; used in calculations */
		this.halfWidth = this.sprite.displayWidth / 2;
		/** @type {number} The original label Y position */
		this.labelYPosition =
			-this.sprite.displayHeight - (constants.LABEL_SIZE / 2);
		/** @type {Phase.GameObjects.Label} The username label for the avatar */
		this.label =
			this.scene.add.text(
				0, this.labelYPosition, username,
				{
					fontFamily: `"${constants.FONT_FAMILY}"`,
					fontSize: constants.LABEL_SIZE,
					stroke: constants.STROKE_COLOR,
					strokeThickness: constants.STROKE_THICKNESS,
				})
			.setOrigin(0.5, 1);
		/** The avatar's container, allowing us to manipulate a single object */
		this.container = this.scene.add.container();
		/** The name of the next state to transition to */
		this.nextState = null;
		/** The state machine's currently active state */
		this.currentState = createMachine(
			{
				id: uuid(),
				initial: 'idling',
				states: {
					deciding: {
						entry: ['decide'],
						on: {
							DECIDED: [
								{ target: 'walking', cond: (_, evt) => evt.next == 'walking' },
								{ target: 'idling', cond: (_, evt) => evt.next == 'idling' },
							],
						},
					},
					idling: {
						entry: ['idle'],
						on: { DECIDE: ['deciding'], },
					},
					walking: {
						entry: ['walk'],
						on: { DECIDE: ['deciding'], },
					},
				},
			},
			{
				actions: {
					decide: (context, event) => {
						const rand = Math.random();
						let next = null;

						if (rand < constants.CHANCE_TO_WALK) {
							//console.debug('decided to walk');
							next = 'walking';
						}
						else {
							//console.debug('decided to idle');
							next = 'idling';
						}

						this.stateService.send({
							type: 'DECIDED',
							next: next,
							prev: this.currentState.value,
						});
					},
					idle: (context, event) => {
						//console.debug('idling');
						this.container.body.setVelocityX(0);
						this.sprite.play(`${this.key}.idle.${this.face}`);
						setTimeout(
							this.stateService.send.bind(this, 'DECIDE'),
							Math.random() * constants.TIMEOUT_MAX);
					},
					walk: (context, event) => {
						//console.debug('walking');

						let swap = Math.random() < (
							event.prev == 'walking'
								? constants.CHANCE_TO_CHANGE_IF_WALKING
								: constants.CHANCE_TO_CHANGE);

						if (swap)
							this.changeFace();

						if (swap || event.prev != 'walking') {
							this.container.body.setVelocityX(
								(constants.WALK_MIN_VELOCITY
									+ Math.random()
									* (constants.WALK_MAX_VELOCITY
										- constants.WALK_MIN_VELOCITY))
								* (this.face == constants.FACE_LEFT ? -1 : 1));
							this.sprite.play(`${this.key}.walking.${this.face}`);
						}

						setTimeout(
							this.stateService.send.bind(this, 'DECIDE'),
							Math.random() * constants.TIMEOUT_MAX);
					},
				}
			},
		);
		/** The service used for communicating with this avatar's state machine */
		this.stateService = interpret(this.currentState);

		// startup
		this.label.avatar = this;
		this.label.container = this.container;
		this.label.overlapping = false;
		this.scene.physics.world.enableBody(this.label);
		this.container.avatar = this;
		this.scene.physics.world.enableBody(this.container);
		this.stateService.onTransition(state => {
			this.previousState = this.currentState.name;
			this.currentState = state;
		});
		this.stateService.start();
		this.stateService.send('idle');
		this.ready();
	}

	/** called from constructor to await physics */
	ready() {
		if (!this.container.body || !this.label.body)
			return setTimeout(this.ready.bind(this), 100);

		this.container.body.setSize(
			this.sprite.displayWidth, this.sprite.displayHeight, true);
		this.container.setSize(
			this.sprite.displayWidth, this.sprite.displayHeight, true);
		this.container.add(this.sprite);
		this.container.add(this.label);
		this.container.setPosition(
			Math.random() * (constants.SCREEN_WIDTH - this.sprite.displayWidth),
			constants.SCREEN_HEIGHT);
	}

	/** update the avatar per animation frame */
	update() {
		if (!this.container.body || !this.label.body)
			return;

		// raise/lower labels to avoid overlap

		const notThisLabel = this.scene.labelGroup.children.entries
			.filter(l => l != this);

		const shouldRise = notThisLabel.some(l =>
			l.body.left <= this.label.body.right
			&& l.body.right >= this.label.body.left
			&& l.body.top < this.label.body.bottom + constants.LABEL_RISE_MARGIN
			&& (l.body.bottom > this.label.body.bottom
				|| (l.body.bottom == this.label.body.bottom
					&& l.body.x < this.label.body.x)));

		const shouldFall = !shouldRise
			&& this.label.y < this.labelYPosition
			&& !notThisLabel.some(l =>
				l.body.left <= this.label.body.right
				&& l.body.right >= this.label.body.left
				&& l.body.top < this.label.body.bottom + constants.LABEL_FALL_MARGIN
				&& l.body.bottom > this.label.body.bottom);

		if (shouldRise)
			this.label.body.setVelocityY(-constants.LABEL_FLOAT_VELOCITY);
		else if (shouldFall)
			this.label.body.setVelocityY(constants.LABEL_FLOAT_VELOCITY);
		else
			this.label.body.setVelocityY(0);

		if (this.label.y > this.labelYPosition)
			this.label.setPosition(this.label.x, this.labelYPosition);

		// turn around if avatar hits the edge of the screen
		if (this.currentState.value == 'walking'
			&& (
				(this.container.body.x <= 0
					&& this.container.body.velocity.x < 0)
				|| (this.container.body.x >=
					constants.SCREEN_WIDTH - this.sprite.displayWidth
					&& this.container.body.velocity.x > 0)))
		{
			this.changeFace();
			this.sprite.play(`${this.key}.walking.${this.face}`);
			this.container.body.setVelocityX(-this.container.body.velocity.x);
		}
	}

	// extensions

	/** flip the sprite's facing */
	changeFace() {
		this.face = this.face == constants.FACE_LEFT
			? constants.FACE_RIGHT
			: constants.FACE_LEFT;
		//console.debug(`facing ${this.face}`);
	}
}

export default Avatar;
