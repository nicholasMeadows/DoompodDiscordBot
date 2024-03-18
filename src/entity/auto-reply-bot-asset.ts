import {Column, ForeignKey, Model, Table} from "sequelize-typescript";
import BotAsset from "./bot-asset";
import AutoReply from "./auto-reply";

@Table({tableName:"auto-reply-bot-asset"})
export default class AutoReplyBotAsset extends Model {

    @ForeignKey(() => BotAsset)
    @Column({allowNull: false})
    declare botAssetId: number;

    @ForeignKey(() => AutoReply)
    @Column({allowNull: false})
    declare autoReplyId: number;
}