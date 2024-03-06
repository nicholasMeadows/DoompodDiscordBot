const {DOOMPOD_GUILD_ID, DOOMPOD_HALL_OF_DOOT_CHANNEL_ID, REACTION_HALL_OF_DOOT_JSON_DATA_PATH,
    REACTION_HALL_OF_DOOT_MAX_MESSAGE_AGE_WEEKS, REACTION_HALL_OF_DOOT_MAX_MESSAGE_AGE_MINUTES,
    REACTION_HALL_OF_DOOT_MAX_MESSAGE_AGE_HOURS, REACTION_HALL_OF_DOOT_MAX_MESSAGE_AGE_DAYS,
    REACTION_HALL_OF_DOOT_NUM_OF_REACTIONS_REQUIRED
} = require("../constants");
const fs = require("fs");
const nodeHtmlToImage = require('node-html-to-image');

module.exports = class ReactionHallOfDoot {

    constructor(client) {
        this.client = client;
    }

    async handle(guildId, channelId, messageId, messageCreatedTimestampMilliseconds) {
        if(guildId !== DOOMPOD_GUILD_ID || channelId === DOOMPOD_HALL_OF_DOOT_CHANNEL_ID)
            return;
        const channel = this.client.channels.cache.get(channelId);
        channel.messages.fetch(messageId).then(message => {
            const dataset = this.#readReactionJsonDataset();

            const minEpochForMessage = this.#calcMinEpochForMessage()
            const messageCreatedTimestampSeconds = Math.floor(messageCreatedTimestampMilliseconds / 1000);
            if (minEpochForMessage > messageCreatedTimestampSeconds) {
                if (dataset[messageId] !== undefined) {
                    delete dataset[messageId];
                    this.#saveReactionJsonDataset(dataset);
                }
                return;
            }

            const messageData = dataset[messageId] === undefined ?  {
                messageCreatedTimestampSeconds: messageCreatedTimestampSeconds,
                sentToHallOfDoot: false
            } : dataset[messageId];

            const reactions = message.reactions.cache;
            for (let reactionKeyAndObj of reactions) {
                const reactionCount = reactionKeyAndObj[1].count;
                if(reactionCount >=REACTION_HALL_OF_DOOT_NUM_OF_REACTIONS_REQUIRED && !messageData.sentToHallOfDoot) {
                    messageData.sentToHallOfDoot = true;
                    this.#sendMessageToHallOfDoot(message);
                    break;
                }
            }
            dataset[messageId] = messageData;
            this.#saveReactionJsonDataset(dataset);
        });
    }

    #readReactionJsonDataset() {
        if (!fs.existsSync(REACTION_HALL_OF_DOOT_JSON_DATA_PATH)) {
            return {}
        }
        return JSON.parse(fs.readFileSync(REACTION_HALL_OF_DOOT_JSON_DATA_PATH, 'utf8'));
    }

    #saveReactionJsonDataset(dataset) {
        fs.writeFileSync(REACTION_HALL_OF_DOOT_JSON_DATA_PATH, JSON.stringify(dataset));
    }

    #calcMinEpochForMessage() {
        const maxAgeWeeksInSeconds = REACTION_HALL_OF_DOOT_MAX_MESSAGE_AGE_WEEKS * 7 * 24 * 60 * 60;
        const maxAgeDaysInSeconds = REACTION_HALL_OF_DOOT_MAX_MESSAGE_AGE_DAYS * 24 * 60 * 60;
        const maxAgeHoursInSeconds = REACTION_HALL_OF_DOOT_MAX_MESSAGE_AGE_HOURS * 60 * 60;
        const maxAgeMinutesInSeconds = REACTION_HALL_OF_DOOT_MAX_MESSAGE_AGE_MINUTES * 60;
        const epochDiff = maxAgeWeeksInSeconds + maxAgeDaysInSeconds + maxAgeHoursInSeconds + maxAgeMinutesInSeconds;
        return Math.floor((Date.now() / 1000) - epochDiff);
    }

    async #sendMessageToHallOfDoot(message) {
        const img = await this.#createHallOfDootImage(message);
        const messagePayload = {
            files: [
                {
                    attachment: img
                }
            ],
            content: message.url
        };
        this.client.channels.fetch(DOOMPOD_HALL_OF_DOOT_CHANNEL_ID).then((channel) => {
            channel.send(messagePayload);
        });
    }

    async #createHallOfDootImage(message) {
        const messageGuildMember = message.member;
        const authorServerAvatarUrl = messageGuildMember.avatarURL();
        const authorServerNickName = messageGuildMember.nickname;

        const userProfileAvatarUrl = message.author.avatarURL();
        const userProfileName = message.author.username;

        let avatarUrl = authorServerAvatarUrl;
        if(authorServerAvatarUrl === null || authorServerAvatarUrl === ''){
            avatarUrl = userProfileAvatarUrl;
        }

        let username =authorServerNickName;
        if(username === null || username === ''){
            username = userProfileName;
        }

        const html = fs.readFileSync('reactionHallOfDootMessageTemplate.html', "utf-8")
        return await nodeHtmlToImage({
            encoding: 'binary',
            puppeteerArgs: {
                args: ['--no-sandbox']
            },
            content: {
                avatarUrl: avatarUrl,
                guildNickName: username,
                messageTextContent: message.content === '' ? undefined : message.content,
                attachments: message.attachments === undefined ? undefined : message.attachments.map((attachment) => attachment.url)
            },
            handlebarsHelpers: {
                isdefined: (a) => a !== undefined,
            },
            html: html
        });
    }
};

