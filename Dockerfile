FROM python:latest
COPY requirements.txt /
RUN pip install -r requirements.txt
COPY bot.py /
COPY fonts/meiryo.ttc /usr/share/fonts/WindowsFonts/
COPY fonts/meiryob.ttc /usr/share/fonts/WindowsFonts/
RUN ["fc-cache"]
COPY scraper.py /
COPY template.svg /
CMD ["python3", "-u", "bot.py"]
