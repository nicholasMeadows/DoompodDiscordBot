import {Column, ForeignKey, Model, NotNull, Table} from "sequelize-typescript";
import Cron from "./cron";
import Sticker from "./sticker";

@Table({tableName:"cron-sticker"})
export default class CronSticker extends Model {
    @ForeignKey(() => Cron)
    @Column({allowNull: false})
    declare cronId: number;

    @ForeignKey(() => Sticker)
    @Column({allowNull: false})
    declare stickerId: number;
}