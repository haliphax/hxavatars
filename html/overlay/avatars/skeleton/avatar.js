import Avatar from '../avatar.js';

const metadata = {
	animations: {
		idle: {
			left: [0],
			right: [9],
			frameRate: 1,
		},
		walking: {
			left: [1, 2, 3, 4, 5, 6, 7, 8],
			right: [10, 11, 12, 13, 14, 15, 16, 17],
			frameRate: 10,
		},
	},
	frameHeight: 47,
	frameWidth: 64,
	scale: 2,
};

class ExtendedAvatar extends Avatar {
	//
}

export { metadata, ExtendedAvatar };
