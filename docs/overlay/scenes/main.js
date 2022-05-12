import constants from '../../constants.js';
import { createMachine, interpret }
	from 'https://unpkg.com/xstate@4/dist/xstate.web.js';
import emitter from '../emitter.js';
import { uuid } from '../../util.js';

/** main game scene */
class MainScene extends Phaser.Scene {
	constructor() {
		super('main');
	}

	create() {
		// events
		this.events.on('pause', this.onPauseScene.bind(this));
		this.events.on('resume', this.onResumeScene.bind(this));
		emitter.on('register-avatar', this.onRegisterAvatar.bind(this));

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
		for (let avatar of this.spriteGroup.children.entries) {
			// turn around if avatar hits the edge of the screen
			if (avatar.stateMachine.currentState.value == 'walking'
				&& (
					(avatar.container.body.x <= 0
						&& avatar.container.body.velocity.x < 0)
					|| (avatar.container.body.x >=
						constants.SCREEN_WIDTH - avatar.displayWidth
						&& avatar.container.body.velocity.x > 0)))
			{
				avatar.changeFace();
				avatar.play(`${avatar.key}.walking.${avatar.face}`);
				avatar.container.body.setVelocityX(-avatar.container.body.velocity.x);
			}

			avatar.update();
		}
	}

	// scene events

	onPauseScene() {
		for (let avatar of this.spriteGroup.children.entries) {
			avatar.stateMachine.stateService.stop();
		}
	}

	onResumeScene() {
		for (let avatar of this.spriteGroup.children.entries) {
			avatar.stateMachine.stateService.start();
		}
	}

	// game events

	onRegisterAvatar(avatar) {
		this.physics.add.existing(avatar);
		this.spriteGroup.add(avatar);
		this.labelGroup.add(avatar.label);

		if (avatar.stateMachine) {
			avatar.stateMachine.stateService.stop();
			delete avatar.stateMachine;
		}

		avatar.stateMachine = {
			nextState: null,
			currentState: createMachine(
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

							avatar.stateMachine.stateService.send({
								type: 'DECIDED',
								next: next,
								prev: avatar.stateMachine.currentState.value,
							});
						},
						idle: (context, event) => {
							//console.debug('idling');
							avatar.container.body.setVelocityX(0);
							avatar.play(`${avatar.key}.idle.${avatar.face}`);
							setTimeout(
								avatar.stateMachine.stateService.send.bind(this, 'DECIDE'),
								Math.random() * constants.TIMEOUT_MAX);
						},
						walk: (context, event) => {
							//console.debug('walking');

							let swap = Math.random() < (
								event.prev == 'walking'
									? constants.CHANCE_TO_CHANGE_IF_WALKING
									: constants.CHANCE_TO_CHANGE);

							if (swap)
								avatar.changeFace();

							if (swap || event.prev != 'walking') {
								avatar.container.body.setVelocityX(
									(constants.WALK_MIN_VELOCITY
										+ Math.random()
										* (constants.WALK_MAX_VELOCITY
											- constants.WALK_MIN_VELOCITY))
									* (avatar.face == constants.FACE_LEFT ? -1 : 1));
								avatar.play(`${avatar.key}.walking.${avatar.face}`);
							}

							setTimeout(
								avatar.stateMachine.stateService.send.bind(this, 'DECIDE'),
								Math.random() * constants.TIMEOUT_MAX);
						},
					},
				}),
			};

		/** The service used for communicating with this avatar's state machine */
		avatar.stateMachine.stateService =
			interpret(avatar.stateMachine.currentState);
		avatar.stateMachine.stateService.onTransition(state => {
			avatar.stateMachine.previousState =
				avatar.stateMachine.currentState.name;
			avatar.stateMachine.currentState = state;
		});
		avatar.stateMachine.stateService.start();
		avatar.stateMachine.stateService.send('idle');
	}
}

export default MainScene;
