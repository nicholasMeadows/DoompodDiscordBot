import {BelongsTo, Column, ForeignKey, HasMany, Model, NotNull, Table} from "sequelize-typescript";
import Guild from "./guild";
import Cron from "./cron";
import ChannelMessage from "./channel-message";
import HallOfDootConfig from "./hall-of-doot-config";

@Table({tableName:"channel"})
export default class Channel extends Model {
    @Column({allowNull: false, unique: true})
    declare discordId: string;

    @ForeignKey(() => Guild)
    @Column({allowNull: false})
    declare guildId: number;

    @BelongsTo(() => Guild)
    declare guild: Guild;

    @HasMany(() => Cron)
    declare crons: Cron[];

    @HasMany(() => ChannelMessage)
    declare messages: ChannelMessage[];

    @HasMany(() => HallOfDootConfig)
    declare hallOfDootConfigs: HallOfDootConfig[];
}