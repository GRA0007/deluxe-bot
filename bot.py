import discord
import re
import random

from bs4 import BeautifulSoup
import html2text
from wand.api import library
import wand.color
import wand.image
from PIL import Image
import requests
from io import BytesIO
import numpy

# Import scraper
import scraper

version = '0.2'

trophy_colors = {
	'trophy_Normal': {
		'border': '#b8b8b8',
		'shadow': '#5c5d66'
	},
	'trophy_Bronze': {
		'border': '#dd723e',
		'shadow': '#81350f'
	},
	'trophy_Silver': {
		'border': '#c1d0e8',
		'shadow': '#2937a0'
	},
	'trophy_Gold': {
		'border': '#ffdf4b',
		'shadow': '#bb3e07'
	},
	'trophy_Rainbow': {
		'border': 'url(#trophy-rainbow-border)',
		'shadow': 'url(#trophy-rainbow-shadow)'
	}
}

rank_colors = {
	'rating_base_normal.png': {
		'fill': '#FFF',
		'border': '#a3aebe'
	},
	'rating_base_blue.png': {
		'fill': '#45cdff',
		'border': '#217cf8'
	},
	'rating_base_green.png': {
		'fill': '#7efa0f',
		'border': '#0e6f93'
	},
	'rating_base_orange.png': {
		'fill': '#ffea00',
		'border': '#ff9000'
	},
	'rating_base_red.png': {
		'fill': '#ff3939',
		'border': '#a40808'
	},
	'rating_base_purple.png': {
		'fill': '#e260ff',
		'border': '#6301c6'
	},
	'rating_base_bronze.png': {
		'fill': 'url(#rank-bronze)',
		'border': '#700303'
	},
	'rating_base_silver.png': {
		'fill': 'url(#rank-silver)',
		'border': '#283172'
	},
	'rating_base_gold.png': {
		'fill': 'url(#rank-gold)',
		'border': '#6d0202'
	},
	'rating_base_rainbow.png': {
		'fill': 'url(#rank-rainbow)',
		'border': '#221c9a'
	}
}

# Draw a profile card
def draw_image(profile):
	svg_code = None
	with open('template.svg', 'r', encoding="utf8") as f:
		data_text = f.readlines()
		svg_code = ' '.join(data_text)

	if svg_code != None:
		# Edit SVG
		soup = BeautifulSoup(svg_code, 'xml')

		rank_bg = soup.find('rect', id='rank_bg')
		rank_border = soup.find('path', id='rank_border')
		rank_shadow = soup.find('rect', id='rank_shadow')

		trophy_bg = soup.find('rect', id='trophy_bg')
		trophy_border = soup.find('path', id='trophy_border')
		trophy_shadow = soup.find('path', id='trophy_shadow')

		trophy = soup.find('text', id='Trophy')
		name = soup.find('text', id='Username')
		rating = soup.find('text', id='Rank')
		max_rating = soup.find('text', id='Max_rank')
		stars = soup.find('text', id='Stars')
		comment = soup.find('text', id='Comment')

		rank_type = profile['rating_base'][profile['rating_base'].rfind("/")+1:]
		rank_bg['style'] = 'fill: ' + rank_colors[rank_type]['fill']
		rank_border['style'] = 'fill: ' + rank_colors[rank_type]['border']
		rank_shadow['style'] = 'fill: ' + rank_colors[rank_type]['border']

		trophy_bg['style'] = 'fill: url(#' + profile['trophy_status'] + ')'
		trophy_border['style'] = 'fill: ' + trophy_colors[profile['trophy_status']]['border']
		trophy_shadow['style'] = 'fill: ' + trophy_colors[profile['trophy_status']]['shadow']

		trophy.string.replace_with(profile['trophy'])
		name.string.replace_with(profile['name'])
		rating.string.replace_with(profile['rating'])
		max_rating.string.replace_with(profile['rating_max'])
		stars.string.replace_with(profile['stars'])
		if 'comment' in profile:
			comment.string.replace_with(profile['comment'])
		else:
			comment.string.replace_with('')

		# Convert SVG to PNG
		svg_blob = str.encode(str(soup))

		with wand.image.Image(blob=svg_blob, format="svg") as image:
			png_image = image.make_blob("png")

		img_buffer = numpy.asarray(bytearray(png_image), dtype='uint8')
		bytesio = BytesIO(img_buffer)
		pil_img = Image.open(bytesio)

		# Profile image
		response = requests.get(profile['image'])
		profile_image = Image.open(BytesIO(response.content))
		profile_image = profile_image.resize((220, 220), Image.ANTIALIAS)

		# Grade image
		response = requests.get(profile['grade'])
		grade_image = Image.open(BytesIO(response.content))
		grade_image = grade_image.resize((95, 48), Image.ANTIALIAS)

		pil_img.paste(profile_image, (40, 40), profile_image)
		pil_img.paste(grade_image, (280, 210), grade_image)

		image_name = 'temp.png'
		pil_img.save(image_name)
		return(image_name)
	else:
		return(None)

class Dxbot(discord.Client):
	async def on_ready(self):
		print('Logged on as {0}\n---------------------'.format(self.user))
		game = discord.Game('searching for codes')
		await client.change_presence(activity=game)

	async def on_message(self, message):
		if message.author == client.user:
			return

		input = message.content.strip()
		try:
			# If input is a number and channel is Benpai's testing channel, or #dx-friend-codes channel
			if int(input) and (message.channel.id == 352449754573045763 or message.channel.id == 670567133700161568):
				await message.channel.trigger_typing()
				intl = scraper.get_user(input, False)
				jp = None
				if intl == None:
					await message.channel.trigger_typing()
					jp = scraper.get_user(input, True)

				if intl == None and jp == None:
					await message.channel.send('Profile not found')
				else:
					type = ''
					friend_url = ''
					profile = None
					if intl != None:
						profile = intl
						type = 'International'
						friend_url = 'https://maimaidx-eng.com/maimai-mobile/friend/search/searchUser/?friendCode=' + input
					elif jp != None:
						profile = jp
						type = 'Japanese'
						friend_url = 'https://maimaidx.jp/maimai-mobile/friend/search/searchUser/?friendCode=' + input

					image = draw_image(profile)

					file = discord.File(image, filename="profile.png")
					embed = discord.Embed(color=0x51bcf3, title=type + ' profile for ' + profile['name'], url=friend_url)
					embed.set_image(url="attachment://profile.png")
					await message.channel.send(file=file, embed=embed)
		except ValueError:
			return

client = Dxbot()
client.run(os.environ.get('BOT_KEY'))
