import {Message, MessageReaction, PartialMessageReaction} from "discord.js";
import AutoReplyTrigger from "../model/enum/auto-reply-trigger";
import {Repositories} from "../model/mongo-db-info";
import AutoReplyInfo from "../model/auto-reply-info";
import BotAsset from "../entity/bot-asset";
import Sticker from "../entity/sticker";
import Channel from "../entity/channel";
import MessageEntity from "../entity/message"
import Log from "../log";

export default class AutoReplyFeature {
    private _repositories: Repositories;
    private logger = new Log(this);

    constructor(repositories: Repositories) {
        this._repositories = repositories;
    }

    async handleMessageCreate(message: Message<boolean>) {
        this.handle(await message.fetch(true), AutoReplyTrigger.MESSAGE_CONTENT);
    }

    async handleMessageReactionAdd(interaction: MessageReaction | PartialMessageReaction) {
        this.handle(await interaction.message.fetch(true), AutoReplyTrigger.MESSAGE_REACTION);
    }

    private async handle(message: Message, autoReplyTrigger: AutoReplyTrigger) {
        const guildDiscordId = message.guildId;
        if (guildDiscordId === null) {
            this.logger.warn(`Guild ${guildDiscordId} was not found on discord message.`);
            return;
        }
        const guildRepository = this._repositories.guildRepository;
        const autoReplyInfos = await guildRepository.findAutoRepliesByGuildDiscordIdAndAutoReplyTrigger(guildDiscordId, autoReplyTrigger).toArray();
        if (autoReplyInfos === undefined || autoReplyInfos.length == 0) {
            this.logger.info(`No auto replies found for guild id ${guildDiscordId} and trigger type ${autoReplyTrigger}`);
            return;
        }
        for (const autoReplyInfo of autoReplyInfos) {
            switch (autoReplyTrigger) {
                case AutoReplyTrigger.MESSAGE_CONTENT:
                    this.handleAutoReplyForMessageContent(message, autoReplyInfo);
                    break;
                case AutoReplyTrigger.MESSAGE_REACTION:
                    this.handleAutoReplyForMessageReaction(message, autoReplyInfo);
                    break;
            }
        }
    }

    async handleAutoReplyForMessageContent(message: Message, autoReplyInfo: AutoReplyInfo) {
        const replyChancePercentage = autoReplyInfo.replyChancePercentage;
        if (Math.random() > replyChancePercentage / 100) {
            this.logger.info("Reply chance not met");
            return;
        }
        const triggerTerms = autoReplyInfo.triggerTerms;
        if (triggerTerms === undefined) {
            this.logger.warn('No defined trigger terms');
            return;
        }
        const messageContent = message.content.toLowerCase();
        if (!triggerTerms.some(term => messageContent.includes(term.toLowerCase()))) {
            this.logger.info('Trigger term not found in message');
            return;
        }
        this.replyToMessage(autoReplyInfo.randomizeAttachmentsSent, message, autoReplyInfo.replyWithAssets, autoReplyInfo.replyWithStickers, autoReplyInfo.replyWithText);
    }

    async handleAutoReplyForMessageReaction(message: Message, autoReplyInfo: AutoReplyInfo) {
        if (message.guildId === null) {
            return;
        }

        const channelRepository = this._repositories.channelRepository;
        const messageRepository = this._repositories.messageRepository;
        const messageAlreadyRepliedTo = await messageRepository.findMessageByGuildChannelMessageReactionId(message.guildId, message.channelId, message.id, autoReplyInfo._id).next();
        if (messageAlreadyRepliedTo !== null) {
            this.logger.info('Message was already replied to.')
            return;
        }

        if (Math.random() > autoReplyInfo.replyChancePercentage / 100) {
            this.logger.info('Percentage not met')
            return;
        }

        const requiredReactions = autoReplyInfo.requiredReactionsForReply;
        if (requiredReactions === undefined || requiredReactions.length === 0) {
            this.logger.warn('no required reactions found');
            return;
        }

        const messageReactions = message.reactions.cache;
        for (const requiredReaction of requiredReactions) {
            const messageReaction = messageReactions.get(requiredReaction.reactionKey);
            if (messageReaction === undefined) {
                this.logger.info('Reaction requirment not met');
                return;
            }
            if (messageReaction.count < requiredReaction.reactionCount) {
                this.logger.info('Not enough reactions for this reply');
                return;
            }
        }


        let channel = await channelRepository.findChannelByChannelDiscordId(message.channelId).next();
        if (channel === null) {
            channel = new Channel();
            channel.discordId = message.channelId;
            await channelRepository.saveChannel(message.guildId, channel);
        }

        let messageEntity = await messageRepository.findMessageByGuildChannelMessageId(message.guildId, channel.discordId, message.id).next();
        if (messageEntity === null) {
            messageEntity = new MessageEntity();
            messageEntity.discordId = message.id;
        }

        if (messageEntity.repliedToByAutoReplyObjectIds === undefined) {
            messageEntity.repliedToByAutoReplyObjectIds = [];
        }
        messageEntity.repliedToByAutoReplyObjectIds.push(autoReplyInfo._id);
        await messageRepository.saveMessage(message.guildId, channel.discordId, messageEntity);

        this.replyToMessage(autoReplyInfo.randomizeAttachmentsSent, message, autoReplyInfo.replyWithAssets, autoReplyInfo.replyWithStickers, autoReplyInfo.replyWithText);
    }

    replyToMessage(randomizeAttachmentsSent: boolean, message: Message, replyWithAssets: BotAsset[], replyWithStickers: Sticker[], replyWithText: string) {
        const paths: string[] = [];
        const stickerIds: string[] = [];

        if (randomizeAttachmentsSent) {
            if (replyWithAssets !== undefined && replyWithAssets.length > 0 && replyWithStickers !== undefined && replyWithStickers.length > 0) {
                if (Math.random() < 0.5) {
                    const assetIndex = Math.floor(Math.random() * replyWithAssets.length)
                    paths.push(replyWithAssets[assetIndex].path);
                } else {
                    const assetIndex = Math.floor(Math.random() * replyWithStickers.length)
                    stickerIds.push(replyWithStickers[assetIndex].discordId);
                }
            } else if (replyWithAssets !== undefined && replyWithAssets.length > 0) {
                const assetIndex = Math.floor(Math.random() * replyWithAssets.length)
                paths.push(replyWithAssets[assetIndex].path);
            } else if (replyWithStickers !== undefined && replyWithStickers.length > 0) {
                const assetIndex = Math.floor(Math.random() * replyWithStickers.length)
                stickerIds.push(replyWithStickers[assetIndex].discordId);
            }
        } else {
            if (replyWithAssets !== undefined && replyWithAssets.length > 0) {
                paths.push(...replyWithAssets.map(asset => asset.path));
            }
            if (replyWithStickers !== undefined && replyWithStickers.length > 0) {
                stickerIds.push(...replyWithStickers.map(sticker => sticker.discordId));
            }
        }

        if (paths.length === 0 && stickerIds.length === 0 && (replyWithText === undefined || replyWithText.length === 0)) {
            this.logger.error('Cannot reply. Not message content');
            return;
        }

        message.reply({
            content: replyWithText,
            files: paths,
            stickers: stickerIds
        })
    }
}