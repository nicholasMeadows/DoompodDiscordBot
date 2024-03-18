import {BelongsTo, BelongsToMany, Column, ForeignKey, HasMany, Model, Table} from "sequelize-typescript";
import Guild from "./guild";
import AutoReplyTrigger from "../model/enum/auto-reply-trigger";
import BotAsset from "./bot-asset";
import Sticker from "./sticker";
import AutoReplySticker from "./auto-reply-sticker";
import {Col} from "sequelize/types/utils";
import MessageReaction from "./message-reaction";
import AutoReplyMessageReaction from "./auto-reply-message-reaction";
import ChannelMessage from "./channel-message";
import ChannelMessageAutoReply from "./channel-message-auto-reply";
import AutoReplyBotAsset from "./auto-reply-bot-asset";

@Table({tableName:"auto-reply"})
export default class AutoReply extends Model {
    @Column({allowNull: false})
    declare name: string;

    @Column({allowNull: false})
    declare replyChancePercentage: number;

    @Column({allowNull: false})
    declare triggerType: AutoReplyTrigger;

    @Column
    declare replyWithText: string;


    @BelongsToMany(() => BotAsset, () => AutoReplyBotAsset)
    declare replyWithAssets: BotAsset[];

    @BelongsToMany(() => Sticker, () => AutoReplySticker)
    declare replyWithStickers: Sticker[];






    @Column
    declare triggerTerms: string;









    // @BelongsToMany(() => MessageReaction, () => AutoReplyMessageReaction)
    @HasMany(() => AutoReplyMessageReaction)
    declare autoReplyMessageReaction: AutoReplyMessageReaction[];








    @ForeignKey(() => Guild)
    @Column({allowNull: false})
    declare guildId: number;

    @BelongsTo(() => Guild)
    declare guild: Guild;

    @BelongsToMany(() => ChannelMessage, () => ChannelMessageAutoReply)
    declare repliedTo: ChannelMessage[];
}