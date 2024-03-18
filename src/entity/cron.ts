import {BelongsTo, BelongsToMany, Column, ForeignKey, HasMany, Model, NotNull, Table} from "sequelize-typescript";
import Guild from "./guild";
import Sticker from "./sticker";
import CronSticker from "./cron-sticker";
import BotAsset from "./bot-asset";
import CronBotAsset from "./cron-bot-asset";
import Channel from "./channel";
import CronAction from "../model/enum/cron-action";

@Table({tableName:"cron"})
export default class Cron extends Model {
    @Column({allowNull: false})
    declare name: string;

    @Column({allowNull: false})
    declare schedule: string;

    @Column({allowNull: false})
    declare action: CronAction;

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

    @BelongsToMany(() => Sticker, () => CronSticker)
    declare stickers: Sticker[];

    @BelongsToMany(() => BotAsset, () => CronBotAsset)
    declare assets: BotAsset[];
}