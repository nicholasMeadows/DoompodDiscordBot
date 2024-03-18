import {AutoIncrement, Column, ForeignKey, Model, NotNull, PrimaryKey, Table} from "sequelize-typescript";
import Cron from "./cron";
import Sticker from "./sticker";
import BotAsset from "./bot-asset";
import {Col} from "sequelize/types/utils";

@Table({tableName:"cron-bot-asset"})
export default class CronBotAsset extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column
    declare id: number

    @ForeignKey(() => Cron)
    @Column({allowNull: false})
    declare cronId: number;

    @ForeignKey(() => BotAsset)
    @Column({allowNull: false})
    declare botAssetId: number;
}