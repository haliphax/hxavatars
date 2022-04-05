import constants from '../../constants.js';
import emitter from '../emitter.js';

/** main game scene */
class MainScene extends Phaser.Scene {
	constructor() {
		super('main');

		emitter.on('register-avatar', this.onRegisterAvatar.bind(this));
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
		for (let avatar of this.spriteGroup.children.entries)
			avatar.update();
	}

	// events

	onRegisterAvatar(avatar) {
		this.physics.add.existing(avatar);
		this.spriteGroup.add(avatar);
		this.labelGroup.add(avatar.label);
	}
}

export default MainScene;
