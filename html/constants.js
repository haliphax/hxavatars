const constants = {
	CHANCE_TO_CHANGE: 0.5,
	CHANCE_TO_CHANGE_IF_WALKING: 0.2,
	CHANCE_TO_WALK: 0.5,
	CLIENT_ID: "v9n67wa15yeokwksrb6a12x8vybbgw",
	FACE_LEFT: "left",
	FACE_RIGHT: "right",
	FONT_FAMILY: "Syne Mono",
	GRAVITY: 0,
	LABEL_FALL_MARGIN: 12,
	LABEL_FLOAT_VELOCITY: 100,
	LABEL_RISE_MARGIN: 8,
	LABEL_SIZE: 20,
	OAUTH_REDIRECT_URI: "",
	OAUTH_URL: "",
	SCREEN_HEIGHT: window.innerHeight,
	SCREEN_WIDTH: window.innerWidth,
	STROKE_COLOR: "#000",
	STROKE_THICKNESS: 6,
	TIMEOUT_MAX: 5000,
	WALK_MAX_VELOCITY: 60,
	WALK_MIN_VELOCITY: 20,
};

constants.OAUTH_REDIRECT_URI = encodeURIComponent(
	window.location.href.replace(/(?:overlay\/?)?(?:[^/]\.html|$)/i, "oauth"),
);

constants.OAUTH_URL =
	`https://id.twitch.tv/oauth2/authorize` +
	`?client_id=${constants.CLIENT_ID}` +
	`&redirect_uri=${constants.OAUTH_REDIRECT_URI}` +
	`&response_type=token` +
	`&scope=chat:read%20chat:edit`;

export default constants;
