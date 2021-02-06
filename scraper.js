const puppeteer = require('puppeteer');
let config = {};
try {
	config = require('./config.json');
} catch (e) {
	config = {
		token: process.env.token,
		sega_id: process.env.sega_id,
		sega_pass: process.env.sega_pass,
		channel_id: process.env.channel_id
	};
}

const intl_login = 'https://lng-tgk-aime-gw.am-all.net/common_auth/login?site_id=maimaidxex&redirect_url=https://maimaidx-eng.com/maimai-mobile/&back_url=https://maimai.sega.com/';
const intl_friend_url = 'https://maimaidx-eng.com/maimai-mobile/friend/search/searchUser/?friendCode=';

const jp_login = 'https://maimaidx.jp/maimai-mobile/';
const jp_friend_url = 'https://maimaidx.jp/maimai-mobile/friend/search/searchUser/?friendCode=';

const pageFunction = () => {
	if (document.querySelector('.basic_block') == null) {
		return null;
	}

	let image = document.querySelector('.basic_block > img').src;
	let trophy_status = document.querySelector('.basic_block .trophy_block').classList[1];
	let trophy = document.querySelector('.basic_block .trophy_inner_block span').innerText;
	let name = document.querySelector('.basic_block .name_block').innerText;
	let rating = document.querySelector('.basic_block .rating_block').innerText;
	let rating_base = document.querySelector('.basic_block .f_r img').src;

	let rating_max = '';
	if (document.querySelector('.basic_block .f_r .p_r_5')) {
		rating_max = document.querySelector('.basic_block .f_r .p_r_5').textContent;
	}

	let grade = document.querySelector('.basic_block img.f_l.h_25').src;
	let stars = document.querySelector('.basic_block img.h_20').nextSibling.textContent;
	let comment = document.querySelector('.friend_comment_block').textContent.trim();

	return {
		'image': image,
		'trophy_status': trophy_status,
		'trophy': trophy,
		'name': name,
		'rating': rating,
		'rating_base': rating_base,
		'rating_max': rating_max,
		'grade': grade,
		'stars': stars,
		'comment': comment
	}
};

async function getUser(user_id, jp) {
	const browser = await puppeteer.launch({'args': ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();

	// login
	await page.goto(jp ? jp_login : intl_login, { waitUntil: 'networkidle0' });
	if (jp) {
		try {
			// Login form
			await page.type('input[name=segaId]', config.sega_id);
			await page.type('input[name=password]', config.sega_pass);
			await Promise.all([
				page.click('button[type=submit]'),
				page.waitForNavigation({ waitUntil: 'networkidle0' }),
			]);

			// Select aime
			await Promise.all([
				page.click('button[type=submit]'),
				page.waitForNavigation({ waitUntil: 'networkidle0' }),
			]);
		} catch (e) {
			console.error("Error while logging in to the JP server: " + e.message);
		}

		try {
			// Search code
			await page.goto(jp_friend_url + user_id, { waitUntil: 'networkidle0' });
		} catch (e) {
			console.log("Error while navigating to a profile from the JP server: " + e.message);
		}
	} else {
		try {
			// Login form
			await page.click('span.c-button--openid--segaId');
			await page.type('#sid', config.sega_id);
			await page.type('#password', config.sega_pass);
			await Promise.all([
				page.click('#btnSubmit'),
				page.waitForNavigation({ waitUntil: 'networkidle0' }),
			]);
		} catch (e) {
			console.error("Error while logging in to the INTL server: " + e.message);
		}

		try {
			// Search code
			await page.goto(intl_friend_url + user_id, { waitUntil: 'networkidle0' });
		} catch (e) {
			console.log("Error while navigating to a profile from the INTL server: " + e.message);
		}
	}

	let user = 'error';
	try {
		user = await page.evaluate(pageFunction);
	} catch (e) {
		console.error(e);
	}
	await browser.close();
	return user;
}

module.exports = { getUser, intl_friend_url, jp_friend_url };
