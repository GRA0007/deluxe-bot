import mechanize
import http.cookiejar
from bs4 import BeautifulSoup
import html2text
import re
import os

# Static
sid = os.environ.get('SEGA_ID')
password = os.environ.get('SEGA_PASS')

intl_login = 'https://lng-tgk-aime-gw.am-all.net/common_auth/login?site_id=maimaidxex&redirect_url=https://maimaidx-eng.com/maimai-mobile/&back_url=https://maimai.sega.com/'
intl_search = 'https://maimaidx-eng.com/maimai-mobile/friend/search/searchUser/?friendCode='

jp_login = 'https://maimaidx.jp/maimai-mobile/'
jp_search = 'https://maimaidx.jp/maimai-mobile/friend/search/searchUser/?friendCode='

def get_user(code, jp):
	# Browser
	br = mechanize.Browser()

	# Cookie Jar
	cj = http.cookiejar.LWPCookieJar()
	br.set_cookiejar(cj)

	# Browser options
	br.set_handle_equiv(True)
	br.set_handle_gzip(True)
	br.set_handle_redirect(True)
	br.set_handle_referer(True)
	br.set_handle_robots(False)
	br.set_handle_refresh(mechanize._http.HTTPRefreshProcessor(), max_time=1)

	br.addheaders = [('User-agent', 'Chrome')]

	user = None

	if (jp):
		br.open(jp_login)

		br.select_form(nr=0)

		br.form['segaId'] = sid
		br.form['password'] = password

		br.submit()

		br.select_form(nr=0)
		br.submit()

		soup = BeautifulSoup(br.open(jp_search + code).read(), 'html.parser')

		if (soup.find('div', {'class': 'basic_block'})):
			image = soup.find('div', {'class': 'basic_block'}).img['src']
			trophy_status = soup.find('div', {'class': 'basic_block'}).div.find('div', {'class': 'trophy_block'})['class'][1]
			trophy = soup.find('div', {'class': 'basic_block'}).div.find('div', {'class': 'trophy_inner_block'}).span.contents[0]
			name = soup.find('div', {'class': 'basic_block'}).div.find('div', {'class': 'name_block'}).contents[0]
			rating = soup.find('div', {'class': 'basic_block'}).div.find('div', {'class': 'rating_block'}).contents[0]
			images = soup.find('div', {'class': 'basic_block'}).div.find_all('img')
			rating_max = soup(text=re.compile('MAX：'))[0]
			stars = soup.find('div', {'class': 'basic_block'}).find('img', {'class': 'h_20'}).next_sibling.strip()
			comment = soup.find('div', {'class': 'friend_comment_block'}).contents[0]

			user = {
				'image': image,
				'trophy_status': trophy_status,
				'trophy': trophy,
				'name': name,
				'rating': rating,
				'rating_base': images[0]['src'],
				'rating_max': rating_max,
				'grade': images[2]['src'],
				'stars': stars,
				'comment': str.strip(comment)
			}
	else:
		br.open(intl_login)

		br.select_form(nr=0)

		br.form['sid'] = sid
		br.form['password'] = password

		br.submit()

		soup = BeautifulSoup(br.open(intl_search + code).read(), 'html.parser')

		if (soup.find('div', {'class': 'basic_block'})):
			image = soup.find('div', {'class': 'basic_block'}).img['src']
			trophy_status = soup.find('div', {'class': 'basic_block'}).div.find('div', {'class': 'trophy_block'})['class'][1]
			trophy = soup.find('div', {'class': 'basic_block'}).div.find('div', {'class': 'trophy_inner_block'}).span.contents[0]
			name = soup.find('div', {'class': 'basic_block'}).div.find('div', {'class': 'name_block'}).contents[0]
			rating = soup.find('div', {'class': 'basic_block'}).div.find('div', {'class': 'rating_block'}).contents[0]
			images = soup.find('div', {'class': 'basic_block'}).div.find_all('img')
			rating_max = soup(text=re.compile('MAX：'))[0]
			stars = soup.find('div', {'class': 'basic_block'}).find('img', {'class': 'h_20'}).next_sibling.strip()

			user = {
				'image': image,
				'trophy_status': trophy_status,
				'trophy': trophy,
				'name': name,
				'rating': rating,
				'rating_base': images[0]['src'],
				'rating_max': rating_max,
				'grade': images[2]['src'],
				'stars': stars
			}

	return(user)

# Usage: get_user('user id', jp server)
