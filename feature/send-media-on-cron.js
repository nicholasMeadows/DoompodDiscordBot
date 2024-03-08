const cron = require("node-cron");
module.exports = class SendMediaOnCron {
    #cron;

    constructor(discordClient, cronSchedule, guildId, channelId, mediaFilesArray, stickerIDsArray) {
        this.#cron = cron.schedule(cronSchedule,() => {
            this.#sendMediaToChannel(discordClient, guildId, channelId, stickerIDsArray, mediaFilesArray);
        });
    }

    #sendMediaToChannel(discordClient, guildId, channelId, stickerIDsArray, mediaFilesArray) {
        discordClient.guilds.fetch(guildId).then(guild => {
            guild.channels.fetch(channelId).then(channel => {
                if (channel != null) {
                    const stickerArray = [];
                    for(let stickerId of stickerIDsArray) {
                        const sticker = guild.stickers.cache.get(stickerId);
                        stickerArray.push(sticker);
                    }

                    channel.send({
                        files: mediaFilesArray,
                        stickers: stickerArray
                    })
                }
            });
        })
    }
}