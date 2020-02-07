# Maimai DX profile scraper Discord bot

Watches a discord channel for a number and attempts to search for that as a friend code on the maimai dx servers, both jp and intl.

## Setup

1. Copy `meiryo.ttc` and `meiryob.ttc` into the `fonts` directory. You may source this from a Windows installation.
2. Build the image using `docker build -t deluxe-bot .`
3. Edit the `env` file to set your SEGA ID credentials and bot token
4. Start up a container using `docker container run --env-file env deluxe-bot:latest`
