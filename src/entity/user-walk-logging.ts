import {BelongsTo, BelongsToMany, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import Guild from "./guild";
import User from "./user";

@Table({tableName:'user-walk-logging'})
export default class UserWalkLogging extends Model {
    @ForeignKey(() => Guild)
    @Column({allowNull: false})
    declare guildId: number;
    @BelongsTo(() => Guild)
    declare guild: Guild

    @ForeignKey(() => User)
    @Column({allowNull: false})
    declare userId: number;
    @BelongsTo(() => User)
    declare user: User;

    @Column({allowNull: false})
    declare milesLogged: number;
}