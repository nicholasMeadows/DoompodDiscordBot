import {Column, ForeignKey, Model, Table} from "sequelize-typescript";
import Sticker from "./sticker";
import AutoReply from "./auto-reply";

@Table({tableName:"auto-reply-sticker"})
export default class AutoReplySticker extends Model {
    @ForeignKey(() => Sticker)
    @Column({allowNull: false})
    declare stickerId: number;

    @ForeignKey(() => AutoReply)
    @Column({allowNull: false})
    declare autoReplyId: number;
}