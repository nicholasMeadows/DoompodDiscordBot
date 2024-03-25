import DiscordClient from "../model/discord-client";
import {Message, PartialMessage, TextChannel} from "discord.js";
import {Repositories} from "../model/mongo-db-info";
import MinecraftReference from "../entity/minecraft-reference";
import Guild from "../entity/guild";
import {ObjectId} from "mongodb";
import User from "../entity/user";
import Log from "../log";

export default class MinecraftReferenceFeature {
    private _discordClient: DiscordClient;
    private _repositories: Repositories;
    private logger = new Log(this);

    constructor(discordClient: DiscordClient, repositories: Repositories) {
        this._discordClient = discordClient;
        this._repositories = repositories;
    }

    async handle(message: Message | PartialMessage) {
        const messageContent = message.content;
        const guildId = message.guildId;
        const channelId = message.channelId;
        const messageAuthor = message.author;
        if (messageContent === null || guildId === null || messageAuthor === null)
            return;

        if (!messageContent.toLowerCase().includes('minecraft'))
            return;

        const authorDiscordId = messageAuthor.id;

        const guildRepository = this._repositories.guildRepository;
        const minecraftReferenceRepository = this._repositories.minecraftReferenceRepository;
        const userRepository = this._repositories.userRepository;

        let guildObjectIdObj = await guildRepository.findGuildObjectIdByGuildDiscordId(guildId).next();
        let guildObjectId: ObjectId;
        if (guildObjectIdObj === null) {
            const guild = new Guild();
            guild.discordId = guildId;
            const discordGuild = message.guild;
            if (discordGuild === null) {
                this.logger.info('Not guild was found and message did not have guild');
                return;
            }
            guild.name = discordGuild.name;
            await guildRepository.saveGuild(guild);
            guildObjectId = guild._id;
        } else {
            guildObjectId = guildObjectIdObj.guildObjectId;
        }

        let user = await userRepository.findGuildUser(guildObjectId, authorDiscordId).next();
        if (user === null) {
            user = new User();
            user.discordUserId = authorDiscordId;
            await userRepository.saveGuildUser(guildObjectId, user);
        }

        const mostRecentMinecraftReference = await minecraftReferenceRepository.findMostRecentMinecraftReference(guildObjectId).next();
        if (mostRecentMinecraftReference != null) {
            const discordChannel = await this._discordClient.channels.fetch(channelId)
            if (discordChannel === null) {
                this.logger.warn(`No discord channel was returned from discord client for channel id ${channelId}`)
                return;
            }

            const lastReferenceMadeAt = mostRecentMinecraftReference.referenceMadeTimestamp;
            const lastReferenceEpoch = lastReferenceMadeAt.getTime() / 1000;
            const nowEpoch = Date.now() / 1000;
            let timeBetween = Math.floor(nowEpoch - lastReferenceEpoch);

            const minecraftReferenceRecordObj = await minecraftReferenceRepository.findMinecraftReferenceRecord(guildObjectId).next();
            let minecraftReferenceRecord: number;
            if (minecraftReferenceRecordObj === null || minecraftReferenceRecordObj.minecraftReferenceRecord === undefined) {
                await minecraftReferenceRepository.saveMinecraftReferenceRecord(guildObjectId, timeBetween);
                minecraftReferenceRecord = timeBetween;
            } else {
                minecraftReferenceRecord = minecraftReferenceRecordObj.minecraftReferenceRecord;
            }

            this.logger.debug(`time between ${timeBetween} the record ${minecraftReferenceRecord}`)
            let message = '';
            if (timeBetween < minecraftReferenceRecord) {
                message = '@everyone Congrats!!!! You have beaten the record for quickest minecraft reference so far. This one clocked in at'
                await minecraftReferenceRepository.saveMinecraftReferenceRecord(guildObjectId, timeBetween);
            } else {
                message = '@everyone Minecraft reference clocking in at'
            }
            const oneDaySeconds = 86400;
            const oneHourSeconds = 3600;
            const oneMinuteSeconds = 60;

            let days: number = 0;
            let hours: number = 0;
            let minutes: number = 0;
            let seconds: number = 0;

            if (timeBetween >= oneDaySeconds) {

                days = Math.floor(timeBetween / oneDaySeconds);
                timeBetween -= oneDaySeconds * days;
            }

            if (timeBetween >= oneHourSeconds) {
                hours = Math.floor(timeBetween / oneHourSeconds);
                timeBetween -= oneHourSeconds * hours;
            }
            if (timeBetween >= oneMinuteSeconds) {
                minutes = Math.floor(timeBetween / oneMinuteSeconds);
                timeBetween -= oneMinuteSeconds * minutes;
            }
            seconds = Math.floor(timeBetween);

            if (days !== 0) {
                message += ` ${days} ${days > 1 ? 'days' : 'day'}`
            }

            if (hours !== 0) {
                message += ` ${hours} ${hours > 1 ? 'hours' : 'hour'}`
            }
            if (minutes !== 0) {
                message += ` ${minutes} ${minutes > 1 ? 'minutes' : 'minute'}`
            }
            if (seconds !== 0) {
                message += ` ${seconds} ${seconds > 1 ? 'seconds' : 'second'}`
            }
            await (discordChannel as TextChannel).send({
                content: message
            })
        }
        let minecraftReference = new MinecraftReference();
        minecraftReference.referenceMadeTimestamp = new Date();
        minecraftReference.referencedByUserObjectId = user._id;
        await minecraftReferenceRepository.saveMinecraftReference(guildObjectId, minecraftReference);
    }
}