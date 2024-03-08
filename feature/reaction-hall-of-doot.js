const fs = require("fs");
const nodeHtmlToImage = require('node-html-to-image');
const EntityCreation = require('../repository/entity-creation');

module.exports = class ReactionHallOfDoot {

    #guildRepository;
    #messageRepository;

    constructor(client, guildRepository, messageRepository) {
        this.client = client;
        this.#guildRepository = guildRepository;
        this.#messageRepository = messageRepository;
    }

    async handle(interaction) {
        const message = interaction.message;
        const guildId = message.guildId
        const channelId = message.channelId;
        const messageId = message.id;

        let guild = this.#guildRepository.findByGuildId(guildId);
        if (guild === undefined) {
            guild = EntityCreation.createGuildEntity(guildId);
        }

        if (this.#isMessageOlderThanMaxAge(message, guild.reactionHallOfDootMaxMessageAge) || guild.hallOfDootChannelId === undefined || guild.hallOfDootChannelId === '') {
            return;
        }
        const channel = this.client.channels.cache.get(channelId);
        channel.messages.fetch(messageId).then(message => {
            const discordReactions = message.reactions.cache
            for (let [reactionId, reaction] of discordReactions) {
                if(reaction.count >= guild.numberOfReactionsForHallOfDoot) {
                    let messageEntity = this.#messageRepository.findByMessageId(messageId);
                    if (messageEntity === undefined) {
                        messageEntity = EntityCreation.createMessageEntity(messageId, channelId, guildId);
                    }

                    if(!messageEntity.messageSentToHallOfDoot) {
                        messageEntity.messageSentToHallOfDoot = true;
                        this.#guildRepository.save(guild);
                        this.#messageRepository.save(messageEntity);
                        this.#sendMessageToHallOfDoot(message, guild.hallOfDootChannelId)
                    }
                }
            }
        });
    }

    #isMessageOlderThanMaxAge(message, reactionHallOfDootMaxMessageAge) {
        const messageCreatedTimestampMS = message.createdTimestamp;
        return (messageCreatedTimestampMS / 1000) < (Date.now() / 1000) - reactionHallOfDootMaxMessageAge;
    }

    async #sendMessageToHallOfDoot(message, hallOfDootChannelId) {
        const img = await this.#createHallOfDootImage(message);
        const messagePayload = {
            files: [
                {
                    attachment: img
                }
            ],
            content: message.url
        };
        this.client.channels.fetch(hallOfDootChannelId).then((channel) => {
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