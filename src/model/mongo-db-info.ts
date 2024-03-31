import {Db, MongoClient} from "mongodb";
import BotAssetRepository from "../repository/bot-asset-repository";
import CronScheduleRepository from "../repository/cron-schedule-repository";
import GuildStickerRepository from "../repository/guild-sticker-repository";
import MessageRepository from "../repository/message-repository";
import ChannelRepository from "../repository/channel-repository";
import WalkLogRepository from "../repository/walk-log-repository";
import {MinecraftReferenceRepository} from "../repository/minecraft-reference-repository";
import UserRepository from "../repository/user-repository";
import GuildRepository from "../repository/guild-repository";
import CapybaraRepository from "../repository/capybara-repository";
import BotCommandRepository from "../repository/bot-command-repository";
import ChannelCommandExecutionProfileRepository from "../repository/channel-command-execution-profile-repository";

export default interface MongoDbInfo {
    mongoClient: MongoClient,
    db: Db,
    repositories: Repositories
}

export interface Repositories {
    guildRepository: GuildRepository,
    channelRepository: ChannelRepository,
    messageRepository: MessageRepository,
    guildStickerRepository: GuildStickerRepository,
    botAssetRepository: BotAssetRepository,
    cronScheduleRepository: CronScheduleRepository,
    walkLogRepository: WalkLogRepository,
    minecraftReferenceRepository: MinecraftReferenceRepository,
    userRepository: UserRepository,
    capybaraRepository: CapybaraRepository,
    botCommandRepository: BotCommandRepository,
    channelCommandExecutionProfileRepository: ChannelCommandExecutionProfileRepository
}