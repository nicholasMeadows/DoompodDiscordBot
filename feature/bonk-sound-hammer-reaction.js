
module.exports = class BonkSoundHammerReaction {
    #messagesReactedTo;

    constructor() {
        this.#messagesReactedTo = [];
    }

    handle(emojiName, message) {
        const messageId =  message.id;
        const hammerEmote = '🔨';

        if(hammerEmote !== emojiName || this.#messagesReactedTo.includes(messageId)) {
            return;
        }
        this.#messagesReactedTo.push(messageId);

        message.reply({
            files: ['./audio/bonk.mp3']
        });
    }
};

