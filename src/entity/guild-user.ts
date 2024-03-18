import {BelongsTo, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import Guild from "./guild";
import User from "./user";
import {DataTypes} from "sequelize";

@Table({tableName:'guild-user'})
export default class GuildUser extends Model {
    @ForeignKey(() => Guild)
    @Column({allowNull: false})
    declare guildId: number;

    @ForeignKey(() => User)
    @Column({allowNull: false})
    declare userId: number;
}