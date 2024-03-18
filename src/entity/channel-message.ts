import {BelongsTo, BelongsToMany, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import Channel from "./channel";
import AutoReply from "./auto-reply";
import ChannelMessageAutoReply from "./channel-message-auto-reply";

@Table({tableName:"channel-message"})
export default class ChannelMessage extends Model {
    @Column({allowNull: false, unique: true})
    declare discordId: string;

    @Column
    declare sentToHallOfDoot: boolean;

    @ForeignKey(() => Channel)
    @Column({allowNull: false})
    declare channelId: number;
    @BelongsTo(() => Channel)
    declare channel: Channel;

    @BelongsToMany(() => AutoReply, () => ChannelMessageAutoReply)
    declare autoReplies: AutoReply[];
}