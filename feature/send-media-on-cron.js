const cron = require("node-cron");
module.exports = class SendMediaOnCron {
    #discordClient;
    #cron;
    #guildId;
    #channelId;
    #mediaFilesArray;
    #stickerIDsArray;

    constructor(discordClient, cronSchedule, guildId, channelId, mediaFilesArray, stickerIDsArray) {
        this.#discordClient = discordClient;
        this.#guildId = guildId;
        this.#channelId = channelId;
        this.#mediaFilesArray = mediaFilesArray;
        this.#stickerIDsArray = stickerIDsArray;
        this.#cron = cron.schedule(cronSchedule,this.#sendMediaToChannel);
    }

    #sendMediaToChannel() {
        this.#discordClient.guilds.fetch(this.#guildId).then(guild => {
            guild.channels.fetch(this.#channelId).then(channel => {
                if (channel != null) {
                    const stickerArray = [];
                    for(let stickerId of this.#stickerIDsArray) {
                        const sticker = guild.stickers.cache.get(stickerId);
                        stickerArray.push(sticker);
                    }
                    channel.send({
                        files: this.#mediaFilesArray,
                        stickers: stickerArray
                    })
                }
            });
        })
    }
}