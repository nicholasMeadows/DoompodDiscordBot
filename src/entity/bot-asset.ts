import {BelongsToMany, Column, Model, NotNull, Table} from "sequelize-typescript";
import CronSticker from "./cron-sticker";
import Cron from "./cron";
import CronBotAsset from "./cron-bot-asset";
import BotAssetType from "../model/enum/bot-asset-type";
import AutoReply from "./auto-reply";
import AutoReplyBotAsset from "./auto-reply-bot-asset";

@Table({tableName: 'bot-asset'})
export default class BotAsset extends Model {
    @Column({allowNull: false})
    declare assetType:BotAssetType

    @Column({allowNull: false})
    declare path: string;

    @BelongsToMany(() =>Cron, () => CronBotAsset)
    declare crons: Cron[];

    @BelongsToMany(() => AutoReply, () => AutoReplyBotAsset)
    declare autoReplies: AutoReply[];
}