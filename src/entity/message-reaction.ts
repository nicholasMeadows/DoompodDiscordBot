import {BelongsTo, BelongsToMany, Column, ForeignKey, HasMany, Model, Table} from "sequelize-typescript";
import Sticker from "./sticker";
import Guild from "./guild";
import AutoReply from "./auto-reply";
import AutoReplyMessageReaction from "./auto-reply-message-reaction";

@Table({tableName:"message-reaction"})
export default class MessageReaction extends Model {
    @Column({allowNull: false})
    declare reactionName: string;

    @ForeignKey(() => Sticker)
    @Column
    declare stickerId: number;

    @BelongsTo(() => Sticker)
    declare sticker: Sticker;

    // @BelongsToMany(() => AutoReply, () => AutoReplyMessageReaction)
    @HasMany(() => AutoReplyMessageReaction)
    declare autoReplyMessageReaction: AutoReplyMessageReaction[];
}