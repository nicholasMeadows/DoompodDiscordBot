FROM node:latest
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install && npm ci && npm cache clean --force
COPY index.js constants.js ./
ADD slash-commands ./slash-commands
ADD assets ./assets
CMD node .