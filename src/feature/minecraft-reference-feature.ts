import {Message, PartialMessage, TextChannel} from "discord.js";
import GuildRepository from "../repository/guild-repository";
import ChannelRepository from "../repository/channel-repository";
import ChannelConverter from "../converter/channel-converter";
import UserRepository from "../repository/user-repository";
import UserConverter from "../converter/user-converter";
import GuildUser from "../entity/guild-user";
import GuildUserRepository from "../repository/guild-user-repository";
import MinecraftReference from "../entity/minecraft-reference";
import MinecraftReferenceRepository from "../repository/minecraft-reference-repository";
import DiscordClient from "../model/discord-client";

export default class MinecraftReferenceFeature {
    private _discordClient: DiscordClient;
    constructor(discordClient: DiscordClient) {
        this._discordClient = discordClient;
    }

    async handle(message: Message | PartialMessage) {
        const messageContent = message.content;
        const guildId = message.guildId;

        if (messageContent === null || guildId === null)
            return;

        if (!messageContent.toLowerCase().includes('minecraft'))
            return;

        const guildRepository = new GuildRepository();
        const guild = await guildRepository.findByDiscordId(guildId);
        if (guild === null) {
            console.log(`Guild ID ${guildId} not found in DB`);
            return;
        }

        const channelRepository = new ChannelRepository();
        const channelId = message.channelId;
        let channel = await channelRepository.findByDiscordId(channelId);
        if(channel == null) {
            const channelConverter = new ChannelConverter();
            channel = channelConverter.convert(message);
            channel.guildId = guild.id;
            channel = await channelRepository.save(channel);
        }

        const fullMessage = await message.fetch(true);
        const userRepository = new UserRepository();
        const userId = fullMessage.author.id;

        let user = await userRepository.findByDiscordId(userId);
        if(user === null) {
            const userConverter = new UserConverter();
            user = userConverter.convert(fullMessage.author.id);
            user = await userRepository.save(user);
        }

        const userGuilds = await guildRepository.findGuildByUserAndGuildId(userId, guildId);
        if(userGuilds.length == 0) {
            const guildUser = new GuildUser();
            guildUser.userId = user.id;
            guildUser.guildId = guild.id;
           await new GuildUserRepository().save(guildUser);
        }

        const minecraftReferenceRepository = new MinecraftReferenceRepository();
        const mostRecentMinecraftReference = await minecraftReferenceRepository.findMostRecentMinecraftReferenceByGuildId(guild.id);
        if(mostRecentMinecraftReference != null) {
            console.log('most recent minecraft reference ', mostRecentMinecraftReference.dataValues)
            const discordChannel = await this._discordClient.channels.fetch(channelId)

            if(discordChannel === null) {
                console.log(`No discord channel was returned from discord client for channel id ${channelId}`)
                return;
            }

            const lastReferenceMadeAt = mostRecentMinecraftReference.createdAt as Date;
            const lastReferenceEpoch = lastReferenceMadeAt.getTime() / 1000;
            const nowEpoch = Date.now()/1000;
            let timeBetween = Math.floor(nowEpoch - lastReferenceEpoch);

            console.log(guild.minecraftReferenceRecord);
            let message = '';
            if(guild.minecraftReferenceRecord === undefined || guild.minecraftReferenceRecord === null){
                guild.minecraftReferenceRecord = timeBetween;
                await guildRepository.save(guild);
            }

            if(timeBetween > guild.minecraftReferenceRecord) {
                message = '@everyone Congrats!!!! You have beaten the record for quickest minecraft reference so far. This one clocked in at'
                guild.minecraftReferenceRecord = timeBetween;
                await guildRepository.save(guild);
                return;
            } else {
                message ='@everyone Minecraft reference clocking in at'
            }

            const oneDaySeconds = 86400;
            const oneHourSeconds = 3600;
            const oneMinuteSeconds = 60;

            let days: number = 0;
            let hours: number = 0;
            let minutes: number = 0;
            let seconds: number = 0;

            if(timeBetween >= oneDaySeconds) {

                days = Math.floor(timeBetween/oneDaySeconds);
                timeBetween -= oneDaySeconds * days;
            }

            if(timeBetween >= oneHourSeconds) {
                hours = Math.floor(timeBetween/oneHourSeconds);
                timeBetween -= oneHourSeconds * hours;
            }
            if(timeBetween >= oneMinuteSeconds) {
                minutes = Math.floor(timeBetween/oneMinuteSeconds);
                timeBetween -= oneMinuteSeconds * minutes;
            }
            seconds = Math.floor(timeBetween);

            if(days !== 0){
                message += ` ${days} ${days > 1 ? 'days': 'day'}`
            }

            if(hours !== 0){
                message += ` ${hours} ${hours > 1 ? 'hours': 'hour'}`
            }
            if(minutes !== 0){
                message += ` ${minutes} ${minutes > 1 ? 'minutes': 'minute'}`
            }
            if(seconds !== 0){
                message += ` ${seconds} ${seconds > 1 ? 'seconds': 'second'}`
            }
            await (discordChannel as TextChannel).send({
                content: message
            })
        }

        let minecraftReference = new MinecraftReference();
        minecraftReference.guildId = guild.id;
        minecraftReference.channelId = channel.id;
        minecraftReference.userId = user.id;
        minecraftReference = await minecraftReferenceRepository.save(minecraftReference);
    }
}