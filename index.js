var fs = require('fs');
const Discord = require('discord.js');
const puppeteer = require('puppeteer');
const config = require('./config.json');
const colors = require('./colors.json');
const { getUser } = require('./scraper');

const client = new Discord.Client();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('searching for codes');
});

async function renderProfile(user) {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	const svg = fs.readFileSync(__dirname + '/template.svg', 'utf8');
	const html = `<!DOCTYPE html><html><head><style>body{margin:0px}</style></head>
	<body>${svg.replace('[IMAGE]', user['image']).replace('[GRADE]', user['grade'])}</body></html>`;

	await page.setContent(html);
	await page.setViewport({width: 900, height: 400});

	// Add content
	await page.evaluate((user, colors) => {
		let rank_type = user['rating_base'].split('/').pop();
		document.querySelector('#rank_bg').style.fill = colors.rank_colors[rank_type]['fill'];
		document.querySelector('#rank_border').style.fill = colors.rank_colors[rank_type]['border'];
		document.querySelector('#rank_shadow').style.fill = colors.rank_colors[rank_type]['border'];

		document.querySelector('#trophy_bg').style.fill = `url(#${user['trophy_status']})`;
		document.querySelector('#trophy_border').style.fill = colors.trophy_colors[user['trophy_status']]['border'];
		document.querySelector('#trophy_shadow').style.fill = colors.trophy_colors[user['trophy_status']]['border'];

		document.querySelector('#Trophy').innerHTML = user['trophy'];
		document.querySelector('#Username').innerHTML = user['name'];
		document.querySelector('#Rank').innerHTML = user['rating'];
		document.querySelector('#Max_rank').innerHTML = 'MAX：' + user['rating_max'];
		document.querySelector('#Stars').innerHTML = user['stars'];
		document.querySelector('#Comment').innerHTML = user['comment'];
	}, user, colors);

	await page.screenshot({path: 'temp.png', clip: {x: 0, y: 0, width: 900, height: 400}});
	await browser.close();
}

client.on('message', async message => {
	if (message.author.bot) return;

	let input = message.content.trim();

	// Is a number and is in the channel to search
	if (message.channel.id == config.channel_id && !isNaN(input)) {
		message.channel.startTyping();
		let intl = await getUser(input, false);
		let jp = null;
		if (intl == null) {
			jp = await getUser(input, true);
		}

		if (intl == null && jp == null) {
			message.channel.stopTyping();
			message.channel.send("Sorry I looked but I couldn't find your profile on the Japanese or International servers <:sd_salt:574629160459173909>");
		} else {
			let type = '';
			let friend_url = '';
			let profile = null;
			if (intl != null) {
				profile = intl;
				type = 'International';
				friend_url = 'https://maimaidx-eng.com/maimai-mobile/friend/search/searchUser/?friendCode=' + input;
			} else if (jp != null) {
				profile = jp;
				type = 'Japanese';
				friend_url = 'https://maimaidx.jp/maimai-mobile/friend/search/searchUser/?friendCode=' + input;
			}

			await renderProfile(profile);
			let embed = new Discord.MessageEmbed()
				.setTitle(`${type} profile for ${profile['name']}`)
				.setURL(friend_url)
				.setColor('#51bcf3')
				.attachFiles([__dirname + '/temp.png'])
				.setImage('attachment://temp.png');
			message.channel.stopTyping();
			message.channel.send(embed);
		}
	}
});

client.login(config.token);
