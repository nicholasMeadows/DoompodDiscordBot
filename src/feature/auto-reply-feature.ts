import DiscordClient from "../model/discord-client";
import {
    Message,
    MessageReaction as DiscordMessageReaction,
    MessageReplyOptions, PartialMessage,
    PartialMessageReaction
} from "discord.js";
import AutoReplyTrigger from "../model/enum/auto-reply-trigger";
import AutoReplyRepository from "../repository/auto-reply-repository";
import GuildRepository from "../repository/guild-repository";
import ChannelMessageRepository from "../repository/channel-message-repository";
import ChannelMessageConverter from "../converter/channel-message-converter";
import ChannelMessageAutoReply from "../entity/channel-message-auto-reply";
import ChannelMessageAutoReplyRepository from "../repository/channel-message-auto-reply-repository";
import AutoReply from "../entity/auto-reply";
import ChannelConverter from "../converter/channel-converter";
import ChannelRepository from "../repository/channel-repository";
import Guild from "../entity/guild";

export default class AutoReplyFeature {
    private _discordClient: DiscordClient;

    constructor(discordClient: DiscordClient) {
        this._discordClient = discordClient;
    }

    handle(inputs: { message?: Message, messageReaction?: DiscordMessageReaction | PartialMessageReaction }) {
        const message = inputs.message;
        if (message !== undefined) {
            this.handleMessage(message);
        }
        const messageReaction = inputs.messageReaction;
        if (messageReaction !== undefined) {
            this.handleMessageReaction(messageReaction);
        }
    }

    private async handleMessage(message: Message) {
        const messageContent = message.content.toLowerCase();
        const guildId = message.guildId;
        if (guildId === null) {
            console.log(`Message ${message.id} did not have guildId.`)
            return;
        }
        const guildRepository = new GuildRepository();
        const channelMessageRepository = new ChannelMessageRepository();

        const guild = await guildRepository.findByDiscordId(guildId);
        if (guild === null) {
            console.log(`Guild ${guildId} was not found.`)
            return;
        }

        const autoReplyRepository = new AutoReplyRepository();
        const autoReplies = await autoReplyRepository.findByGuildIdAndTriggerType(guild.id, AutoReplyTrigger.MESSAGE_CONTENT)
        for (const autoReply of autoReplies) {
            if (Math.random() < autoReply.replyChancePercentage / 100) {
                const messagesAlreadyRepliedTo = await channelMessageRepository.findByDiscordIdAndAutoReplyId(message.id, autoReply.id);
                if (messagesAlreadyRepliedTo.length === 0) {
                    const triggerTerms = autoReply.triggerTerms.split(',');
                    let foundTriggerTerm: string | undefined;
                    for (const triggerTerm of triggerTerms) {
                        if (messageContent.includes(triggerTerm.toLowerCase())) {
                            foundTriggerTerm = triggerTerm;
                            break;
                        }
                    }
                    if (foundTriggerTerm !== undefined) {
                        await this.sendAutoReaction(autoReply, message, guild);
                    }
                }
            }
        }
    }

    private async handleMessageReaction(messageReaction: DiscordMessageReaction | PartialMessageReaction) {
        const message = messageReaction.message;
        const messageId = message.id;
        const guildId = message.guildId;
        if (guildId === null) {
            console.log('Missing guild id on message reaction');
            return;
        }

        const guildRepository = new GuildRepository();
        const autoReplyRepository = new AutoReplyRepository();
        const channelMessageRepository = new ChannelMessageRepository();

        const guild = await guildRepository.findByDiscordId(guildId);
        if (guild === null) {
            console.log(`handleMessageReaction - Guild ID ${guildId} not found.`);
            return;
        }

        const fullMessage = await message.fetch(true);
        const currentFullMessageReactions = fullMessage.reactions.cache;

        const autoReplies = await autoReplyRepository.findByGuildIdAndTriggerType(guild.id, AutoReplyTrigger.MESSAGE_REACTION);
        for (const autoReply of autoReplies) {
            if (Math.random() < autoReply.replyChancePercentage / 100) {
                const messagesAlreadyRepliedTo = await channelMessageRepository.findByDiscordIdAndAutoReplyId(messageId, autoReply.id);
                if (messagesAlreadyRepliedTo.length === 0) {
                    const autoReplyMessageReactions = await autoReply.$get('autoReplyMessageReaction');
                    for (const autoReplyMessageReaction of autoReplyMessageReactions) {
                        const reactionsToTriggerReply = autoReplyMessageReaction.reactionsToTriggerReply;
                        const messageReaction = await autoReplyMessageReaction.$get('messageReaction');
                        if (messageReaction === null) {
                            break;
                        }
                        let discordReaction: DiscordMessageReaction | undefined;
                        if (messageReaction.stickerId !== null) {
                            const sticker = await messageReaction.$get('sticker');
                            if (sticker !== null) {
                                const stickerId = sticker.stickerId
                                discordReaction = currentFullMessageReactions.get(stickerId);
                            }
                        } else {
                            discordReaction = currentFullMessageReactions.get(messageReaction.reactionName)
                        }

                        if (discordReaction === undefined) {
                            console.log(`Required reaction not found.`);
                            break;
                        }
                        if (reactionsToTriggerReply > discordReaction.count) {
                            console.log(`Required reaction found but not enough to trigger reply.`)
                            break;
                        }

                        await this.sendAutoReaction(autoReply, fullMessage, guild);
                    }
                }
            }
        }
    }

    private async sendAutoReaction(autoReply: AutoReply, message: Message | PartialMessage, guild: Guild) {
        const channelConverter = new ChannelConverter();
        let channel = channelConverter.convert(message);
        channel.guildId = guild?.id;
        channel = (await new ChannelRepository().upsert(channel))[0];

        const channelMessageConverter = new ChannelMessageConverter();
        let channelMessage = channelMessageConverter.convert(message);
        channelMessage.channelId = channel.id;
        channelMessage = (await new ChannelMessageRepository().upsert(channelMessage))[0];

        const channelMessageAutoReply = new ChannelMessageAutoReply();
        channelMessageAutoReply.autoReplyId = autoReply.id;
        channelMessageAutoReply.channelMessageId = channelMessage.id;
        await new ChannelMessageAutoReplyRepository().upsert(channelMessageAutoReply);

        await this.sendDiscordMessageReaction(autoReply, message);

    }

    private async sendDiscordMessageReaction(autoReplyEntity: AutoReply, message: Message | PartialMessage) {
        const messageReplyOptions: MessageReplyOptions = {};
        const replyWithText = autoReplyEntity.replyWithText;
        if (replyWithText !== undefined) {
            messageReplyOptions.content = replyWithText;
        }

        const replyWithAssets = await autoReplyEntity.$get('replyWithAssets');
        if (replyWithAssets !== undefined) {
            messageReplyOptions.files = replyWithAssets.map(botAsset => botAsset.path);
        }

        const replyWithStickers = await autoReplyEntity.$get('replyWithStickers');
        if (replyWithStickers !== undefined) {
            messageReplyOptions.stickers = replyWithStickers.map(sticker => sticker.stickerId);
        }

        if (messageReplyOptions.content == undefined && messageReplyOptions.files == undefined && messageReplyOptions.stickers == undefined) {
            console.log('Discord message reply content, files, and stickers were undefined')
            return;
        }
        await message.reply(messageReplyOptions);
    }
}