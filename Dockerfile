FROM node:latest

RUN apt-get update
RUN apt install -y libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2

RUN groupadd -r doombot && useradd -rm -g doombot -G audio,video doombot
WORKDIR /app
RUN chown -hR doombot:doombot /app
USER doombot

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

ADD dist ./
CMD node main.js