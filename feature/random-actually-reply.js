const path = require("node:path");
const {IMAGES_DIR, RANDOM_ACTUALLY_REPLY_GIF_FILE} = require("../constants");
module.exports = class RandomActuallyReply {
    #configService;
    constructor(configService) {
        this.#configService = configService;
    }
    handle(message) {
        const messageContent = message.content;
        if(messageContent.toLowerCase().includes("actually")) {
            const randomActuallyReplyPercentage = this.#configService.getRandomActuallyReplyPercentage();
            if(Math.random() < randomActuallyReplyPercentage/100) {
                message.reply({
                    files:[path.join(IMAGES_DIR, RANDOM_ACTUALLY_REPLY_GIF_FILE)]
                })
            }
        }
    }
}