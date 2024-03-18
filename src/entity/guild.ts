import {
    AutoIncrement,
    BelongsTo,
    BelongsToMany,
    Column,
    ForeignKey,
    HasMany,
    HasOne,
    Model,
    NotNull, PrimaryKey,
    Table
} from "sequelize-typescript";
import Channel from "./channel";
import Cron from "./cron";
import Sticker from "./sticker";
import AutoReply from "./auto-reply";
import HallOfDootConfig from "./hall-of-doot-config";
import User from "./user";
import GuildUser from "./guild-user";
import UserWalkLogging from "./user-walk-logging";

@Table({tableName:"guild"})
export default class Guild extends Model {
    @Column({allowNull: false})
    declare discordId: string;

    @Column
    declare name: string;

    @Column
    declare minecraftReferenceRecord: number;

    @HasMany(() => Channel)
    declare channels: Channel[];

    @HasMany(() => Cron)
    declare crons: Cron[];

    @HasMany(() => Sticker)
    declare stickers: Sticker[];

    @HasMany(() => AutoReply)
    declare autoReplies: AutoReply[];

    @HasOne(() => HallOfDootConfig)
    declare hallOfDootConfig: HallOfDootConfig;

    @BelongsToMany(() => User, () => GuildUser)
    declare users: User[];

    @HasMany(() => UserWalkLogging)
    declare userWalkLogs: UserWalkLogging[];

    @ForeignKey(() => Channel)
    @Column
    declare walkLoggingCompetitionResultsChannelId: number;

    @BelongsTo(() => Channel)
    declare walkLoggingCompetitionResultsChannel: Channel;
}