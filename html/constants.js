const constants = {
	CHANCE_TO_CHANGE: 0.5,
	CHANCE_TO_CHANGE_IF_WALKING: 0.2,
	CHANCE_TO_WALK: 0.5,
	CLIENT_ID: 'v9n67wa15yeokwksrb6a12x8vybbgw',
	FACE_LEFT: 'left',
	FACE_RIGHT: 'right',
	FONT_FAMILY: 'Syne Mono',
	LABEL_FLOAT_VELOCITY: 40,
	LABEL_SIZE: 20,
	SCREEN_HEIGHT: 1080,
	SCREEN_WIDTH: 1920,
	STROKE_COLOR: '#000',
	STROKE_THICKNESS: 4,
	TIMEOUT_MAX: 5000,
	WALK_MAX_VELOCITY: 60,
	WALK_MIN_VELOCITY: 20,
};

constants.OAUTH_URL = `https://id.twitch.tv/oauth2/authorize`
	+ `?client_id=${constants.CLIENT_ID}`
	+ `&redirect_uri=${encodeURIComponent(window.location.href.replace(/[^/]\.html|$/i, 'oauth.html'))}`
	+ `&response_type=token`
	+ `&scope=chat:read%20chat:edit`;

export default constants;
