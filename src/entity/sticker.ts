import {BelongsTo, BelongsToMany, Column, ForeignKey, HasMany, Model, NotNull, Table} from "sequelize-typescript";
import Guild from "./guild";
import CronSticker from "./cron-sticker";
import Cron from "./cron";
import AutoReply from "./auto-reply";
import AutoReplySticker from "./auto-reply-sticker";
import MessageReaction from "./message-reaction";

@Table({tableName: 'sticker'})
export default class Sticker extends Model {
    @Column({allowNull: false})
    declare stickerId: string;

    @BelongsToMany(() => Cron, () => CronSticker)
    declare crons: Cron[];

    @ForeignKey(() => Guild)
    @Column({allowNull: false})
    declare guildId: number;

    @BelongsTo(() => Guild)
    declare guild: Guild;

    @BelongsToMany(() => AutoReply, () => AutoReplySticker)
    declare autoReplies: AutoReply[];

    @HasMany(() => MessageReaction)
    declare messageReactions: MessageReaction[];
}