import DiscordClient from "../model/discord-client";
import {Message, MessageReaction, PartialMessageReaction, TextChannel} from "discord.js";
import {Repositories} from "../model/mongo-db-info";
import Channel from "../entity/channel";
import MessageEntity from "../entity/message";
import path from "node:path";
import {HALL_OFF_DOOT_REACTION_TEMPLATE, HTML_PATH} from "../constants";
import fs from "fs";
import nodeHtmlToImage from "node-html-to-image";

export default class HallOfDootFeature {
    private _discordClient: DiscordClient;
    private _repositories: Repositories;


    constructor(discordClient: DiscordClient, repositories: Repositories) {
        this._discordClient = discordClient;
        this._repositories = repositories;
    }

    async handleOnReactionAdd(messageReaction: MessageReaction | PartialMessageReaction) {
        const message = messageReaction.message;
        const guildDiscordId = message.guildId;
        if (guildDiscordId === null) {
            console.log('guild id not found on message reaction');
            return;
        }

        const guildRepository = this._repositories.guildRepository;
        const messageRepository = this._repositories.messageRepository;
        const channelRepository = this._repositories.channelRepository;
        let messageEntity = await messageRepository.findMessageByGuildChannelMessageId(guildDiscordId, message.channelId, message.id).next();
        if (messageEntity !== null && messageEntity.sentToHallOfDoot) {
            console.log('message already sent to hall of doot');
            return;
        }

        const hallOfDootConfig = await guildRepository.findHallOfDootConfigByGuildDiscordId(guildDiscordId).next();
        if (hallOfDootConfig === null) {
            console.log(' hall of doot config not found in db');
            return;
        }

        const hallOfDootChannel = await channelRepository.findChannelByChannelObjectId(hallOfDootConfig.hallOfDootChannelObjectId).next();
        if (hallOfDootChannel === null) {
            console.log('hall of doot channel not found in db');
            return;
        }

        const fullMessage = await message.fetch(true);
        const messageReactions = fullMessage.reactions.cache;
        const reactionThatMeetsHallOfDootCriteria = messageReactions.find((value, key) => {
            return value.count >= hallOfDootConfig.requiredNumberOfReactions;
        });

        if (reactionThatMeetsHallOfDootCriteria === undefined) {
            console.log('not enough reactions for hall of doot');
            return;
        }

        let channel = await channelRepository.findChannelByChannelDiscordId(message.channelId).next();
        if (channel === null) {
            channel = new Channel();
            channel.discordId = fullMessage.channelId;
            await channelRepository.saveChannel(guildDiscordId, channel);
        }


        if (messageEntity === null) {
            messageEntity = new MessageEntity();
            messageEntity.discordId = message.id;
        }
        messageEntity.sentToHallOfDoot = true;
        await messageRepository.saveMessage(guildDiscordId, message.channelId, messageEntity);

        this.sendMessageToHallOfDoot(fullMessage, hallOfDootChannel.discordId)
    }


    private sendMessageToHallOfDoot(message: Message, sendToChannelId: string) {
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

    private async createHallOfDootImage(message: Message) {
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