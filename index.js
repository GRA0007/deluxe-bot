var fs = require('fs');
const Discord = require('discord.js');
const puppeteer = require('puppeteer');
const colors = require('./colors.json');
const { getUser, intl_friend_url, jp_friend_url } = require('./scraper');

let config;
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

let browser;
let page;

const client = new Discord.Client();

client.on('ready', async () => {
	console.log(`Logged in as ${client.user.tag}!`);
	browser = await puppeteer.launch({'args': ['--no-sandbox', '--disable-setuid-sandbox']});
	client.user.setActivity('Searching for codes');
});

async function renderProfile(user) {
	if (!page)
		page = await browser.newPage();

	const svg = fs.readFileSync(__dirname + '/template.svg', 'utf8');

	await page.setContent(svg);

	// Add content
	let element = await page.$("svg");
	await element.evaluate((svg, user, colors) => {
		let rank_type = user['rating_base'].split('/').pop();
		svg.querySelector('#rank_bg').style.fill = colors.rank_colors[rank_type]['fill'];
		svg.querySelector('#rank_border').style.fill = colors.rank_colors[rank_type]['border'];
		svg.querySelector('#rank_shadow').style.fill = colors.rank_colors[rank_type]['border'];

		svg.querySelector('#trophy_bg').style.fill = `url(#${user['trophy_status']})`;
		svg.querySelector('#trophy_border').style.fill = colors.trophy_colors[user['trophy_status']]['border'];
		svg.querySelector('#trophy_shadow').style.fill = colors.trophy_colors[user['trophy_status']]['border'];

		let imageLoad = new Promise((resolve, reject) => {
			let image = svg.querySelector('#Image');
			image.onload = () => resolve();
			image.onerror = () => reject();
			image.href.baseVal = user['image'];
		});
		let gradeLoad = new Promise((resolve, reject) => {
			let grade = svg.querySelector('#Grade');
			grade.onload = () => resolve();
			grade.onerror = () => reject();
			grade.href.baseVal = user['grade'];
		});
		svg.querySelector('#Trophy').innerHTML = user['trophy'];
		svg.querySelector('#Username').innerHTML = user['name'];
		svg.querySelector('#Rank').innerHTML = user['rating'];
		svg.querySelector('#Max_rank').innerHTML = 'MAX：' + user['rating_max'];
		svg.querySelector('#Stars').innerHTML = user['stars'];
		svg.querySelector('#Comment').innerHTML = user['comment'];
		return Promise.all([imageLoad, gradeLoad]);
	}, user, colors);

	return await element.screenshot({type: 'png'});
}

client.on('message', async message => {
	if (message.author.bot) return;

	let input = message.content.trim();

	// Is a number and is in the channel to search
	if (message.channel.id == config.channel_id && !isNaN(input)) {
		message.channel.startTyping();
		let intl, jp;
		let response = "Sorry I looked but I couldn't find your profile on the Japanese or International servers <:sd_salt:574629160459173909>";

		if ((intl = await getUser(input, false)) != null || (jp = await getUser(input, true)) != null) {
			let type = (intl != null ? 'International' : 'Japanese');
			let friend_url = (intl != null ? intl_friend_url : jp_friend_url) + input;
			let profile = intl || jp;

			response = new Discord.MessageEmbed()
				.setTitle(`${type} profile for ${profile['name']}`)
				.setURL(friend_url)
				.setColor('#51bcf3')
				.attachFiles([{
					name: 'profile.png',
					attachment: await renderProfile(profile),
				}])
				.setImage('attachment://profile.png');
		}

		message.channel.stopTyping();
		message.channel.send(response);
	}
});

client.login(config.token);
