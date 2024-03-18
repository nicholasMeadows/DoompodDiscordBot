import {BelongsTo, BelongsToMany, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import AutoReply from "./auto-reply";
import MessageReaction from "./message-reaction";

@Table({tableName:"auto-reply-message-reaction"})
export default class AutoReplyMessageReaction extends Model {
    @ForeignKey(() => AutoReply)
    @Column({allowNull: false})
    declare autoReplyId: number;

    @BelongsTo(() => AutoReply)
    declare autoReply: AutoReply;

    @ForeignKey(() => MessageReaction)
    @Column({allowNull: false})
    declare messageReactionId: number;

    @BelongsTo(() => MessageReaction)
    declare messageReaction: MessageReaction;

    @Column({allowNull: false})
    declare reactionsToTriggerReply: number;
}