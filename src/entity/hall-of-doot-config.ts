import {BelongsTo, BelongsToMany, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import Guild from "./guild";
import Channel from "./channel";


@Table({tableName:"hall-of-doot-config"})
export default class HallOfDootConfig extends Model {
    @ForeignKey(() => Guild)
    @Column({allowNull: false, unique: true})
    declare guildId: number;

    @BelongsTo(() => Guild)
    declare guild: Guild;

    @Column({allowNull: false})
    declare requiredReactionCount: number;

    @Column({allowNull: false})
    declare useCumulativeReactionCount: boolean;

    @ForeignKey(() => Channel)
    @Column({allowNull: false})
    declare hallOfDootChannelId: number;

    @BelongsTo(() => Channel)
    declare hallOfDootChannel: Channel;

}