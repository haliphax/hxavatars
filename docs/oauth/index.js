import { hs } from '../util.js';

const form = document.querySelector('form');

const onChange = e => {
	const rgx = RegExp(`&${e.target.id}=[^&]+`);

	form.action = form.action.replace(rgx, '');
	form.action =
		`${form.action}&${e.target.id}=${encodeURIComponent(e.target.value)}`;
};

form.setAttribute('action', `${form.action}#oauth=${hs.access_token}`);
form.querySelectorAll('input').forEach(v => v.addEventListener('change', onChange));
