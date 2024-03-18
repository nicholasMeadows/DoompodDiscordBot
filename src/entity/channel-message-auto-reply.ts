import {Column, ForeignKey, Model, Table} from "sequelize-typescript";
import ChannelMessage from "./channel-message";
import AutoReply from "./auto-reply";

@Table({tableName:"channel-message-auto-reply"})
export default class ChannelMessageAutoReply extends Model {
    @ForeignKey(() => ChannelMessage)
    @Column({allowNull: false})
    declare channelMessageId: number;

    @ForeignKey(() => AutoReply)
    @Column({allowNull: false})
    declare autoReplyId: number;
}