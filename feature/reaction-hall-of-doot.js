const {DOOMPOD_GUILD_ID, DOOMPOD_HALL_OF_DOOT_CHANNEL_ID} = require("../constants");
const fs = require("fs");
const nodeHtmlToImage = require('node-html-to-image');

const REACTION_JSON_DATA_PATH = "./reactionHallOfDootData.json";
const MAX_MESSAGE_AGE_WEEKS = 4;
const MAX_MESSAGE_AGE_DAYS = 0;
const MAX_MESSAGE_AGE_HOURS = 0;
const MAX_MESSAGE_AGE_MINUTES = 0;

const NUM_OF_REACTIONS_FOR_HALL_OF_DOOT = 5;
module.exports = class ReactionHallOfDoot {

    constructor(client) {
        this.client = client;
    }

    async handle(guildId, channelId, messageId, messageCreatedTimestampMilliseconds) {
        if(guildId !== DOOMPOD_GUILD_ID)
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

            if (dataset[messageId] === undefined) {
                dataset[messageId] = {
                    messageCreatedTimestampSeconds: messageCreatedTimestampSeconds,
                    numberOfReactions: 0,
                    sentToHallOfDoot: false
                }
            }
            const reactions = message.reactions.cache;
            let reactionCount = 0;
            for (let reactionKeyAndObj of reactions) {
                reactionCount += reactionKeyAndObj[1].count;
            }
            dataset[messageId].numberOfReactions = reactionCount;

            if (dataset[messageId].numberOfReactions >= NUM_OF_REACTIONS_FOR_HALL_OF_DOOT && !dataset[messageId].sentToHallOfDoot) {
                dataset[messageId].sentToHallOfDoot = true;
                this.#sendMessageToHallOfDoot(message)
            }

            this.#saveReactionJsonDataset(dataset);
        });
    }

    #readReactionJsonDataset() {
        if (!fs.existsSync(REACTION_JSON_DATA_PATH)) {
            return {}
        }
        return JSON.parse(fs.readFileSync(REACTION_JSON_DATA_PATH, 'utf8'));
    }

    #saveReactionJsonDataset(dataset) {
        fs.writeFileSync(REACTION_JSON_DATA_PATH, JSON.stringify(dataset));
    }

    #calcMinEpochForMessage() {
        const maxAgeWeeksInSeconds = MAX_MESSAGE_AGE_WEEKS * 7 * 24 * 60 * 60;
        const maxAgeDaysInSeconds = MAX_MESSAGE_AGE_DAYS * 24 * 60 * 60;
        const maxAgeHoursInSeconds = MAX_MESSAGE_AGE_HOURS * 60 * 60;
        const maxAgeMinutesInSeconds = MAX_MESSAGE_AGE_MINUTES * 60;
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

