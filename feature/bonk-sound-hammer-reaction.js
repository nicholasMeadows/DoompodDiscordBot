const fs = require('fs');
const path = require("path");
const {AUDIO_DIR, BONK_SOUND_HAMMER_REACTION_AUTIO_FILE} = require("../constants");
const EntityCreation = require('../repository/entity-creation');
module.exports = class BonkSoundHammerReaction {
#messageRepository;
#guildRepository;
    constructor(guildRepository, messageRepository) {
        this.#guildRepository = guildRepository;
        this.#messageRepository = messageRepository;
    }

    handle(emojiName, message) {
        const hammerEmoji = '🔨';
        if(hammerEmoji !== emojiName) {
            return;
        }
        const guildId = message.guildId;
        const channelId = message.channelId;
        const messageId =  message.id;

        let guildEntity = this.#guildRepository.findByGuildId(guildId);
        if(guildEntity === undefined) {
            guildEntity = EntityCreation.createGuildEntity(guildId);
        }

        let messageEntity = this.#messageRepository.findByMessageId(messageId);
        if(messageEntity === undefined) {
            messageEntity = EntityCreation.createMessageEntity(messageId, channelId, guildId);
        }

        if(!messageEntity.messageReactedToWithBonkHammer){
            messageEntity.messageReactedToWithBonkHammer = true;
            this.#guildRepository.save(guildEntity);
            this.#messageRepository.save(messageEntity);
                message.reply({
                    files: [path.join(AUDIO_DIR, BONK_SOUND_HAMMER_REACTION_AUTIO_FILE)]
                });
        }
    }
};

