import { createMachine, interpret }
	from 'https://unpkg.com/xstate@4/dist/xstate.web.js';
import constants from './constants.js';
import { uuid } from './util.js';

/** on-screen avatar with state machine */
class Avatar {
	constructor(game, avatarDefs, username, key = 'mario') {
		/** @type {string} The avatar owner's username */
		this.username = username;
		/** @type {string} The avatar's sprite name */
		this.key = key;
		/** @type {string} The direction the avatar's sprite is facing */
		this.face = Math.random() < constants.CHANCE_TO_CHANGE
			? constants.FACE_LEFT
			: constants.FACE_RIGHT;
		/** @type {Phaser.GameObjects.Sprite} The avatar's sprite */
		this.sprite = game.physics.add.sprite(0, 0, key)
			.setScale(avatarDefs[key].metadata.scale)
			.setOrigin(0.5, 1);
		/**
		 * @type {number}
		 * Half the width of the avatar's sprite; used in calculations */
		this.halfWidth = this.sprite.displayWidth / 2;
		/** @type {number} The original label Y position */
		this.labelYPosition = constants.SCREEN_HEIGHT
			- this.sprite.displayHeight - (constants.LABEL_SIZE / 2);
		/** @type {Phase.GameObjects.Label} The username label for the avatar */
		this.label =
			game.add.text(0, this.labelYPosition, username,
				{
					fontFamily: `"${constants.FONT_FAMILY}"`,
					fontSize: constants.LABEL_SIZE,
					stroke: constants.STROKE_COLOR,
					strokeThickness: constants.STROKE_THICKNESS,
				})
			.setOrigin(0.5, 1);
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
						this.sprite.body.setVelocityX(0);
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
							this.sprite.body.setVelocityX(
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
		this.label.overlapping = false;
		game.physics.world.enableBody(this.label, Phaser.Physics.Arcade.DYNAMIC_BODY);
		this.stateService.onTransition(state => {
			this.previousState = this.currentState.name;
			this.currentState = state;
		});
		this.stateService.start();
		this.ready();
	}

	/** called from constructor to await physics */
	ready() {
		if (!this.sprite.body || !this.label.body)
			return setTimeout(this.ready.bind(this), 100);

		this.label.body.setSize(this.label.width, this.label.height, true);

		this.sprite.setPosition(
			Math.random() * (constants.SCREEN_WIDTH - this.sprite.displayWidth),
			constants.SCREEN_HEIGHT);

		this.stateService.send('idle');
	}

	/** update the avatar per animation frame */
	update() {
		if (!this.sprite.body || !this.label.body)
			return;

		this.label.setPosition(this.sprite.x, this.labelYPosition);

		if (!this.label.body.touching.none)
			console.log('TOUCHING');

		if (this.currentState.value == 'walking') {
			// turn around if avatar hits the edge of the screen
			if (
				(this.sprite.body.x <= 0
					&& this.sprite.body.velocity.x < 0)
				|| (this.sprite.body.x >=
					constants.SCREEN_WIDTH - this.sprite.displayWidth
					&& this.sprite.body.velocity.x > 0))
			{
				this.changeFace();
				this.sprite.body.setVelocityX(-this.sprite.body.velocity.x);
			}

			if ((this.sprite.body.velocityX < 0 && this.face == constants.FACE_RIGHT)
				|| (this.sprite.body.velocityX > 0 && this.face == constants.FACE_LEFT))
			{
				this.sprite.play(`${this.key}.walking.${this.face}`);
			}
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
