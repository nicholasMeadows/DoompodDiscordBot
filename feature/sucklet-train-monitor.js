const {SUCKLET_TRAIN_TIME_BOX, SUCKLET_TRAIN_COOLDOWN, SUCKLETS_TO_TRIGGER_TRAIN, SUCKLET_STICKER_NAME} = require("../constants");
module.exports = class SuckletTrainMonitor {
  constructor(discordClient) {
    this.channelSuckletTrainCooldown = new Map();
    this.channelSucketTimestamps = new Map();
    this.discordClient = discordClient;
  }
  handle(message) {
    if (message.stickers.size > 0) {
      const channelId = message.channelId;
      const stickers = message.stickers;
      const keys = stickers.keys();
      for (const key of keys) {
        const sticker = stickers.get(key);
        if (sticker.name === SUCKLET_STICKER_NAME) {
          const lastTrainStart =
            this.channelSuckletTrainCooldown.get(channelId);
          if (lastTrainStart != undefined) {
            const cooldownExpiresAt =
              lastTrainStart + SUCKLET_TRAIN_COOLDOWN * 60 * 1000;
            if (cooldownExpiresAt > Date.now()) {
              this.channelSuckletTrainCooldown.set(channelId, Date.now());
              return;
            }
          }

          let suckletTimestamps = this.channelSucketTimestamps.get(channelId);
          if (suckletTimestamps == undefined) {
            suckletTimestamps = [Date.now()];
            this.channelSucketTimestamps.set(channelId, suckletTimestamps);
            return;
          } else if (suckletTimestamps.length + 1 < SUCKLETS_TO_TRIGGER_TRAIN) {
            suckletTimestamps.push(Date.now());
            this.channelSucketTimestamps.set(channelId, suckletTimestamps);
            return;
          }
          suckletTimestamps.push(Date.now());

          const selectTimestampsAfter =
            Date.now() - SUCKLET_TRAIN_TIME_BOX * 60 * 1000;
          suckletTimestamps = suckletTimestamps.filter(
            (timestamp) => timestamp >= selectTimestampsAfter
          );

          if (suckletTimestamps.length >= SUCKLETS_TO_TRIGGER_TRAIN) {
            this.channelSucketTimestamps.delete(channelId);
            const messagePayload = {
              content: "Sucklet Train Startted!!",
              embeds: [],
              stickers: [sticker],
            };
            this.discordClient.channels.fetch(channelId).then((channel) => {
              channel.send(messagePayload);
            });
            this.channelSuckletTrainCooldown.set(channelId, Date.now());
          } else {
            this.channelSucketTimestamps.set(channelId, suckletTimestamps);
          }
        }
      }
    }
  }
};
