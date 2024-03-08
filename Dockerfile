FROM node:latest

RUN apt-get update
RUN apt install -y libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2

WORKDIR /app
ADD assets ./assets
ADD feature ./feature
ADD fonts ./fonts
ADD repository ./repository
ADD service ./service
ADD slash-commands ./slash-commands
COPY index.js constants.js ./
COPY package.json package-lock.json* ./
COPY reactionHallOfDootMessageTemplate.html ./

RUN groupadd -r doombot && useradd -rm -g doombot -G audio,video doombot
RUN chown -hR doombot:doombot /app
USER doombot
RUN npm install && npm ci && npm cache clean --force
CMD node .