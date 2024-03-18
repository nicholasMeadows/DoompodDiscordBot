import DiscordClient from "../model/discord-client";
import {Message, MessageReaction, PartialMessage, PartialMessageReaction, TextChannel} from "discord.js";
import HallOfDootConfig from "../entity/hall-of-doot-config";
import Guild from "../entity/guild";
import Channel from "../entity/channel";
import ChannelConverter from "../converter/channel-converter";
import ChannelMessage from "../entity/channel-message";
import ChannelMessageConverter from "../converter/channel-message-converter";
import fs from "fs";
import nodeHtmlToImage from "node-html-to-image";
import {HALL_OFF_DOOT_REACTION_TEMPLATE, HTML_PATH} from "../constants";
import path from "node:path";
import {Sequelize} from "sequelize-typescript";
import HallOfDootConfigRepository from "../repository/hall-of-doot-config-repository";
import GuildRepository from "../repository/guild-repository";
import ChannelRepository from "../repository/channel-repository";
import ChannelMessageRepository from "../repository/channel-message-repository";

export default class HallOfDootFeature {
    private _discordClient: DiscordClient;

    constructor(discordClient: DiscordClient) {
        this._discordClient = discordClient;
    }

    async handleOnReactionAdd(messageReaction: MessageReaction | PartialMessageReaction) {
        const message = messageReaction.message;
        // const messageId = message.id;
        // const channelId = message.channelId;
        const guildId = message.guildId;
        if (guildId === null) {
            console.log(`Message did not have guild id`);
            return;
        }
        const guildRepository = new GuildRepository();
        const guild = await guildRepository.findByDiscordId(guildId);
        if (guild === null) {
            console.log(`Guild ID ${guildId} not found.`)
            return;
        }

        const hallOfDootConfig = await guild?.$get('hallOfDootConfig');
        if (hallOfDootConfig === null || hallOfDootConfig === undefined) {
            console.log(`Did not find hall of doot config for guild ${guildId}`);
            return;
        }

        const fullMessage = await message.fetch(true);
        const reactions = fullMessage.reactions.cache;

        const requiredReactionCount = hallOfDootConfig.requiredReactionCount;

        let reactionCount = 0;
        for (const [reactionKey, reaction] of reactions) {
            if (hallOfDootConfig.useCumulativeReactionCount) {
                reactionCount += reaction.count;
            } else if (requiredReactionCount >= reaction.count) {
                reactionCount = reaction.count;
                break;
            }
        }

        if (reactionCount >= requiredReactionCount) {
            const channelRepository = new ChannelRepository();
            let channel = await channelRepository.findByDiscordId(message.channelId);
            console.log('channel after first get', channel);
            if (channel === null) {
                const channelConverter = new ChannelConverter();
                channel = channelConverter.convert(message);
                channel.guildId = guild.id;
                channel = await new ChannelRepository().save(channel);
            }
            const channelMessageRepository = new ChannelMessageRepository();
            let channelMessage = await channelMessageRepository.findByMessageDiscordIdAndChannelId(message.id, channel?.id);
            if (channelMessage === null) {
                const channelMessageConverter = new ChannelMessageConverter();
                channelMessage = channelMessageConverter.convert(message);
                channelMessage.channelId = channel?.id;
                channelMessage = await channelMessageRepository.save(channelMessage);
            }

            if (channelMessage.sentToHallOfDoot) {
                console.log(`Message ${message.id} already sent to hall of doot`)
                return;
            }

            channelMessage.sentToHallOfDoot = true;
            channelMessage = await channelMessageRepository.save(channelMessage);
            const hallOfDootChannel = await hallOfDootConfig.$get('hallOfDootChannel');
            if (hallOfDootChannel !== null) {
                this.sendMessageToHallOfDoot(message, hallOfDootChannel.discordId);
            }
        }
    }

    private sendMessageToHallOfDoot(message: Message | PartialMessage, sendToChannelId: string) {
        this.createHallOfDootImage(message).then((data) => {
            this._discordClient.channels.fetch(sendToChannelId).then(channel => {
                if (channel !== undefined) {
                    const messagePayload = {
                        files: [
                            {
                                attachment: data
                            }
                        ],
                        content: message.url
                    };
                    // @ts-ignore
                    (channel as TextChannel).send(messagePayload)
                }
            })
        })
    }

    private async createHallOfDootImage(message: Message | PartialMessage) {
        const messageGuildMember = message.member;
        let authorServerAvatarUrl: string | null = null;
        let authorServerNickName: string | null = null;
        if (messageGuildMember !== null) {
            authorServerAvatarUrl = messageGuildMember.avatarURL();
            authorServerNickName = messageGuildMember.nickname;
        }

        const messageAuthor = message.author;
        let userProfileAvatarUrl: string | null = null;
        let userProfileName: string | null = null;
        if (messageAuthor !== null) {
            userProfileAvatarUrl = messageAuthor.avatarURL();
            userProfileName = messageAuthor.username;
        }

        let avatarUrl = authorServerAvatarUrl;
        if (authorServerAvatarUrl === null || authorServerAvatarUrl === '') {
            avatarUrl = userProfileAvatarUrl;
        }

        let username = authorServerNickName;
        if (username === null || username === '') {
            username = userProfileName;
        }

        const html = fs.readFileSync(path.join(HTML_PATH, HALL_OFF_DOOT_REACTION_TEMPLATE), "utf-8")
        const htmlToImageOptions = {
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
                isdefined: (a: any) => a !== undefined,
            },
            html: html
        };
        // @ts-ignore
        return await nodeHtmlToImage(htmlToImageOptions)
    }
}