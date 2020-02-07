# Maimai DX profile scraper Discord bot

Watches a discord channel for a number and attempts to search for that as a friend code on the maimai dx servers, both jp and intl.

## Setup

1. Install rsvg-convert.
2. Install Imagemagick with `--with-rsvg=yes`.
3. Run `pip install -r requirements.txt` to install the requirements.
4. Set the environment variables `SEGA_ID`, `SEGA_PASS`, and `BOT_KEY`. (Note: The sega account used must have played maimai dx in both regions)
5. Run `python bot.py` to start the bot.
