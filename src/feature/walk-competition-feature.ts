import DiscordClient from "../model/discord-client";
import {ApplicationCommandOptionType, ChatInputCommandInteraction, TextChannel} from "discord.js";
import {Repositories} from "../model/mongo-db-info";
import Guild from "../entity/guild";
import {ObjectId} from "mongodb";
import User from "../entity/user";
import UserWalkLog from "../entity/user-walk-log";
import GuildChannelCronInfo from "../model/guild-channel-cron-info";
import Log from "../log";

export default class WalkCompetitionFeature {
    private _discordClient: DiscordClient;
    private _repositories: Repositories;

    private logger = new Log(this);

    constructor(discordClient: DiscordClient, repositories: Repositories) {
        this._discordClient = discordClient;
        this._repositories = repositories;
    }

    async logWalking(interaction: ChatInputCommandInteraction): Promise<string> {
        const authorId = interaction.user.id
        const guildId = interaction.guildId;
        if (guildId === null) {
            this.logger.warn('interaction didnt have guildId');
            return 'Command not run in a guild. Cannot process request';
        }

        const guildRepository = this._repositories.guildRepository;
        const userRepository = this._repositories.userRepository;
        const walkLogRepository = this._repositories.walkLogRepository;

        let guildObjectIdObj = await guildRepository.findGuildObjectIdByGuildDiscordId(guildId).next();
        let guildObjectId: ObjectId;
        if (guildObjectIdObj === null || guildObjectIdObj.guildObjectId === null) {
            const guild = new Guild();
            guild.discordId = guildId;
            await guildRepository.saveGuild(guild);
            guildObjectId = guild._id;
        } else {
            guildObjectId = guildObjectIdObj.guildObjectId;
        }

        let user = await userRepository.findGuildUser(guildObjectId, authorId).next()
        if (user === null) {
            user = new User();
            user.discordUserId = authorId;
            await userRepository.saveGuildUser(guildObjectId, user);
        }

        const milesOption = interaction.options.get('miles');
        if (milesOption === null || milesOption.value === undefined) {
            return 'You did not give miles as part of the command.'
        }
        const miles = milesOption.value;
        if (milesOption.type !== ApplicationCommandOptionType.Integer) {
            return 'miles was not a number';
        }
        let userWalkLog = new UserWalkLog();
        userWalkLog.milesLogged = miles as number;
        userWalkLog.user = user._id;
        await walkLogRepository.insertUserWalkLog(guildObjectId, userWalkLog);
        return `logged ${miles} miles`
    }

    async myMiles(interaction: ChatInputCommandInteraction): Promise<string> {
        const authorId = interaction.user.id
        const guildId = interaction.guildId;
        if (guildId === null) {
            this.logger.warn('interaction didnt have guildId');
            return 'Command not run in a guild. Cannot process request';
        }

        const guildRepository = this._repositories.guildRepository;
        const walkLogRepository = this._repositories.walkLogRepository;
        const userRepository = this._repositories.userRepository;
        const guildObjectIdObj = await guildRepository.findGuildObjectIdByGuildDiscordId(guildId).next();

        if (guildObjectIdObj === null || guildObjectIdObj.guildObjectId === null) {
            this.logger.warn(`Guild ${guildId} was not found in db`)
            return `<@${authorId}> you have walked 0 miles.`
        }

        let user = await userRepository.findGuildUser(guildObjectIdObj.guildObjectId, authorId).next();
        if (user === null) {
            user = new User();
            user.discordUserId = authorId;
            await userRepository.saveGuildUser(guildObjectIdObj.guildObjectId, user);
            this.logger.info(`User ${authorId} was not found in db`)
            return `<@${authorId}> you have walked 0 miles.`
        }

        const now = new Date();
        const currentMonthNumber = now.getMonth();
        const endMonth = currentMonthNumber === 11 ? 1 : currentMonthNumber + 1;
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endDate = new Date(now.getFullYear(), endMonth, 1, 0, 0, 0, 0);
        const totalMiles = await walkLogRepository.findTotalMilesForMonthForUser(guildObjectIdObj.guildObjectId, user._id, startDate, endDate).next()
        if (totalMiles === null || totalMiles.totalMiles === null) {
            return `<@${authorId}> you have walked 0 miles.`
        }
        return `<@${authorId}> you have walked ${totalMiles.totalMiles} miles.`
    }

    async handlePostWalkingResultsCron(guildChannelCronInfo: GuildChannelCronInfo) {
        const walkLogRepository = this._repositories.walkLogRepository;
        const guildObjectId = guildChannelCronInfo.guildObjectId;

        const walkChannelDiscordIdObj = await walkLogRepository.findWalkLogMonthResultsChannelForGuildObjectId(guildObjectId).next();
        if (walkChannelDiscordIdObj === null || walkChannelDiscordIdObj.discordId === null) {
            this.logger.warn('Could not find which channel to send walk month results to.');
            return;
        }

        const now = new Date();
        let year = now.getFullYear();
        let month = now.getMonth();
        if (month == 0) {
            month = 11;
            year--;
        } else {
            month--;
        }

        const startDate = new Date(year, month, 1, 0, 0, 0, 0);
        const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 0, 0, 0);

        const walkResultsSorted = await walkLogRepository.findTopWalkersForMonth(guildObjectId, startDate, endDate).toArray();
        if (walkResultsSorted === null || walkResultsSorted.length === 0) {
            this.logger.info('No walk results found!');
            return;
        }

        let placeCounter: number = 1;
        let message = '@everyone Time for the walking results!!!!!';

        for (const result of walkResultsSorted) {
            const userId = result.user.discordUserId;
            const totalMiles = result.totalMiles;

            let numberEnding = '';
            if (placeCounter === 1) {
                numberEnding = 'st'
            } else if (placeCounter === 2) {
                numberEnding = 'nd'
            } else if (placeCounter === 3) {
                numberEnding = 'rd'
            }
            message += `\nIn ${placeCounter}${numberEnding} we have <@${userId}> with ${totalMiles} ${totalMiles == 1 ? "mile" : "miles"}!!!!`;
            placeCounter++;
        }

        const discordChannel = await this._discordClient.channels.fetch(walkChannelDiscordIdObj.discordId);
        if (discordChannel !== null) {
            await (discordChannel as TextChannel).send({content: message});
        }
    }

    async getTop3AlongWithMyMiles(interaction: ChatInputCommandInteraction): Promise<string> {
        const authorId = interaction.user.id
        const guildId = interaction.guildId;
        if (guildId === null) {
            this.logger.warn('interaction didnt have guildId');
            return 'Command not run in a guild. Cannot process request';
        }

        const guildRepository = this._repositories.guildRepository;
        const walkLogRepository = this._repositories.walkLogRepository;
        const userRepository = this._repositories.userRepository;

        const guildObjectIdObj = await guildRepository.findGuildObjectIdByGuildDiscordId(guildId).next();
        if (guildObjectIdObj === null || guildObjectIdObj.guildObjectId === null) {
            this.logger.warn(`Guild ${guildId} was not found in db`)
            return `Could not find top walking data.`
        }

        const now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();

        if (month == 11) {
            month = 0
            year++;
        } else {
            month++;
        }
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
        const endDate = new Date(year, month, 1, 0, 0, 0, 0)
        const topWalkData = await walkLogRepository.findTopWalkersForMonth(guildObjectIdObj.guildObjectId, startDate, endDate).toArray()
        let placeCounter: number = 1;
        let message = '';

        for (const total of topWalkData) {
            const userId = total.user.discordUserId;
            const totalMiles = total.totalMiles;
            let numberEnding = '';
            if (placeCounter === 1) {
                numberEnding = 'st'
            } else if (placeCounter === 2) {
                numberEnding = 'nd'
            } else if (placeCounter === 3) {
                numberEnding = 'rd'
            }
            message += `\nRight now in ${placeCounter}${numberEnding} place is <@${userId}> with ${totalMiles} ${totalMiles == 1 ? "mile" : "miles"}!!!!`;
            placeCounter++;
        }

        const userDiscordId = interaction.user.id;
        const user = await userRepository.findGuildUser(guildObjectIdObj.guildObjectId, userDiscordId).next();
        if (user !== null) {
            const userWalkLogsTotalMiles = await walkLogRepository.findTotalMilesForMonthForUser(guildObjectIdObj.guildObjectId, user._id, startDate, endDate).next()
            if (userWalkLogsTotalMiles !== null) {
                message += `\n\n <@${user.discordUserId}> you currently logged ${userWalkLogsTotalMiles.totalMiles} ${userWalkLogsTotalMiles.totalMiles === 1 ? 'mile' : 'miles'}`
            }
        }
        if (message.length == 0) {
            return 'No walk data found.';
        }
        return message;
    }
}