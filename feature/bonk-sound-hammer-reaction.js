const fs = require('fs');
const path = require("path");
const {AUDIO_DIR, BONK_SOUND_HAMMER_REACTION_AUTIO_FILE} = require("../constants");
const BONK_SOUND_REACTION_MESSAGES_PATH = "./bonkSoundHammerReactionMessages.json";
module.exports = class BonkSoundHammerReaction {

    constructor() {
    }

    handle(emojiName, message) {
        const messageId =  message.id;
        const hammerEmote = '🔨';

        let messagesReactedTo = [];
        if(fs.existsSync(BONK_SOUND_REACTION_MESSAGES_PATH)){
           messagesReactedTo = JSON.parse(fs.readFileSync(BONK_SOUND_REACTION_MESSAGES_PATH, 'utf-8'));
        }

        if(hammerEmote !== emojiName || messagesReactedTo.includes(messageId)) {
            return;
        }
        messagesReactedTo.push(messageId);

        fs.writeFileSync(BONK_SOUND_REACTION_MESSAGES_PATH, JSON.stringify(messagesReactedTo));

        message.reply({
            files: [path.join(AUDIO_DIR, BONK_SOUND_HAMMER_REACTION_AUTIO_FILE)]
        });
    }
};

