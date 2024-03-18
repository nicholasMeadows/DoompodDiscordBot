import {BelongsTo, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import Guild from "./guild";
import Channel from "./channel";
import User from "./user";

@Table({tableName:'minecraft-reference'})
export default class MinecraftReference extends Model{

    @ForeignKey(() => Guild)
    @Column({allowNull: false})
    declare guildId: number;

    @BelongsTo(() => Guild)
    declare guild: Guild;

    @ForeignKey(() => Channel)
    @Column({allowNull: false})
    declare channelId: number;

    @BelongsTo(() => Channel)
    declare channel: Channel;

    @ForeignKey(() => User)
    @Column({allowNull: false})
    declare userId: number;

    @BelongsTo(() => User)
    declare user: User;
}