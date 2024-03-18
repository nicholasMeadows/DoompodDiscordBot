import {AutoIncrement, BelongsTo, BelongsToMany, Column, HasMany, Model, PrimaryKey, Table} from "sequelize-typescript";
import Guild from "./guild";
import GuildUser from "./guild-user";
import MinecraftReference from "./minecraft-reference";
import UserWalkLogging from "./user-walk-logging";

@Table({tableName: 'user'})
export default class User extends Model {
    @Column({allowNull: false, unique: true})
    declare discordId: string;

    @BelongsToMany(() => Guild, () => GuildUser)
    declare guilds: Guild[];

    @HasMany(() => MinecraftReference)
    declare minecraftReferences: MinecraftReference[];

    @HasMany(() => UserWalkLogging)
    declare walkLogs: UserWalkLogging[];
}