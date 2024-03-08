const cron = require("node-cron");
const CronAction = require("../enum/cron-action")
module.exports = class BotCron {
    #discordClient;
    #cronEntity;

    constructor(discordClient, cronEntity) {
        this.#discordClient = discordClient;
        this.#cronEntity = cronEntity;
        cron.schedule(cronEntity.schedule, () => this.#handleCron())
    }

    #handleCron() {
        console.log(`Running cron "${this.#cronEntity.name}"`)
        const cronAction = this.#cronEntity.action;
        if (cronAction === CronAction.SEND_MEDIA || CronAction.SEND_STICKER) {
            this.#discordClient.guilds.fetch(this.#cronEntity.guildId).then(guild => {
                guild.channels.fetch(this.#cronEntity.channelId).then(channel => {
                    if (channel != null) {
                        const stickerArray = [];
                        for (let stickerId of this.#cronEntity.stickerIds) {
                            const sticker = guild.stickers.cache.get(stickerId);
                            stickerArray.push(sticker);
                        }

                        channel.send({
                            files: this.#cronEntity.mediaPaths,
                            stickers: stickerArray
                        })
                    }
                });
            })
        }


    }
}