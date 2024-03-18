import {ChatInputCommandInteraction, ApplicationCommandOptionType, TextChannel} from "discord.js";
import GuildRepository from "../repository/guild-repository";
import GuildConverter from "../converter/guild-converter";
import UserRepository from "../repository/user-repository";
import UserConverter from "../converter/user-converter";
import UserWalkLogging from "../entity/user-walk-logging";
import UserWalkLoggingRepository from "../repository/user-walk-logging-repository";
import {isInt} from "validator";
import GuildUserRepository from "../repository/guild-user-repository";
import GuildUser from "../entity/guild-user";
import Cron from "../entity/cron";
import ChannelRepository from "../repository/channel-repository";
import DiscordClient from "../model/discord-client";

export default class WalkCompetitionFeature {
    private _discordClient: DiscordClient;

    constructor(discordClient: DiscordClient) {
        this._discordClient = discordClient;
    }

    async logWalking(interaction: ChatInputCommandInteraction): Promise<string> {
        const authorId = interaction.user.id
        const guildId = interaction.guildId;
        if (guildId === null) {
            console.log('interaction didnt have guildId');
            return 'Something went wrong... @Fluffy get over here and fix yo shit!';
        }

        const guildRepository = new GuildRepository();
        let guild = await guildRepository.findByDiscordId(guildId);
        if (guild === null) {
            guild = new GuildConverter().convert(guildId);
            guild = await guildRepository.save(guild);
        }

        const userRepository = new UserRepository();
        let user = await userRepository.findByUserDiscordIdAndGuildId(authorId, guild.id)
        if (user === null) {
            const userConverter = new UserConverter();
            user = userConverter.convert(authorId);
            user = await userRepository.save(user);
        }

        const milesOption = interaction.options.get('miles');
        if(milesOption === null || milesOption.value === undefined) {
            return 'You did not give miles as part of the command.'
        }
        const miles = milesOption.value;
        if(milesOption.type !== ApplicationCommandOptionType.Integer) {
            return 'miles was not a number';
        }
        let userWalkLogging = new UserWalkLogging();
        userWalkLogging.guildId = guild.id;
        userWalkLogging.userId = user.id;
        userWalkLogging.milesLogged = miles as number;
        const userWalkLoggingRepo = new UserWalkLoggingRepository()
        userWalkLogging = await userWalkLoggingRepo.save(userWalkLogging);
        return `logged ${miles} miles`
    }

    async myMiles(interaction: ChatInputCommandInteraction): Promise<string> {
        const authorId = interaction.user.id.trim();
        const guildId = interaction.guildId;
        if (guildId === null) {
            console.log('interaction didnt have guildId');
            return 'Something went wrong...';
        }

        const guildRepository = new GuildRepository();
        let guild = await guildRepository.findByDiscordId(guildId);
        if (guild === null) {
            console.log(`Guild ${guildId} was not found in db`)
            return `<@${authorId}> you have walked 0 miles.`
        }


        const userRepository = new UserRepository();
        let user = await userRepository.findByUserDiscordIdAndGuildId(authorId, guild.id)
        if (user === null) {
            const userConverter = new UserConverter();
            user = userConverter.convert(authorId);
            user = await userRepository.save(user);

            const guildUserRepository = new GuildUserRepository();
            const guildUser = new GuildUser();
            guildUser.guildId = guild.id;
            guildUser.userId = user.id;
            await guildUserRepository.save(guildUser);
            console.log(`Guild ${guildId} was not found in db`)
            return `<@${authorId}> you have walked 0 miles.`
        }

        const now = new Date();
        const userWalkLogginRepo = new UserWalkLoggingRepository();
        const totalMiles = await userWalkLogginRepo.findUserWalkLogsTotalsByGuildIdUserIdMonthAndYearLimit1(guild.id, user.id, now.getFullYear(), now.getMonth()+1);

        if(totalMiles === null || totalMiles === undefined || totalMiles.length === 0) {
            return `<@${authorId}> you have walked 0 miles.`
        }
        return `<@${authorId}> you have walked ${totalMiles[0].dataValues.total} miles.`
    }

    async handlePostWalkingResultsCron(cronEntity: Cron) {
        const guildId = cronEntity.guildId;
        const guildRepo = new GuildRepository();
        const guild = await guildRepo.findById(guildId)
        if(guild === null || guild.walkLoggingCompetitionResultsChannelId === undefined){
            return
        }

        const now = new Date();
        let month = now.getMonth()+1;
        let year = now.getFullYear()
        if(month == 1) {
            month = 12;
            year -= 1;
        } else {
            month -= 1;
        }

        const userWalkLoggingRepository = new UserWalkLoggingRepository();
        const groupedTotals = (await userWalkLoggingRepository.findUserWalkLogsTotalsByGuildIdMonthAndYearLimit3(guildId, year, month)).map(entity => entity.dataValues)
        this.sortGroupedWalkTotals(groupedTotals);

        const walkLoggingCompetitionResultsChannelId = guild.walkLoggingCompetitionResultsChannelId;
        const channel = await new ChannelRepository().findById(walkLoggingCompetitionResultsChannelId);
        if(channel === null) {
            return;
        }

        let placeCounter: number = 1;
        let message = '@everyone Time for the walking results!!!!!';

        const userRepository = new UserRepository();
        for(const total of groupedTotals) {

            const userId = total.userId;
            const totalMiles = total.total;
            const user = await userRepository.findById(userId);
            if(user != null) {
                let numberEnding='';
                if(placeCounter === 1) {
                    numberEnding = 'st'
                } else if(placeCounter === 2) {
                    numberEnding = 'nd'
                } else if(placeCounter === 3) {
                    numberEnding = 'rd'
                }
                message += `\nIn ${placeCounter}${numberEnding} we have <@${user.discordId}> with ${totalMiles} ${totalMiles == 1 ? "mile":"miles"}!!!!`;
                placeCounter++;
            }
        }

        const discordChannel = await this._discordClient.channels.fetch(channel.discordId);
        if(discordChannel !== null) {
            (discordChannel as TextChannel).send({content: message});
        }
    }

    async getTop3AlongWithMyMiles(interaction: ChatInputCommandInteraction) {
        const guildDiscordId = interaction.guildId;
        if(guildDiscordId === null) {
            return "Something went wrong pulling data."
        }
        const guildRepository = new GuildRepository();
        const guild = await guildRepository.findByDiscordId(guildDiscordId);
        if(guild === null) {
            return "No walking data found.";
        }

        const now = new Date();
        let month = now.getMonth()+1;
        let year = now.getFullYear();

        const userWalkLoggingRepository = new UserWalkLoggingRepository();
        const groupedTotals = (await userWalkLoggingRepository.findUserWalkLogsTotalsByGuildIdMonthAndYearLimit3(guild.id, year, month)).map(entity => entity.dataValues)
        this.sortGroupedWalkTotals(groupedTotals);

        let placeCounter: number = 1;
        let message = '';

        const userRepository = new UserRepository();
        for(const total of groupedTotals) {

            const userId = total.userId;
            const totalMiles = total.total;
            const user = await userRepository.findById(userId);
            if(user != null) {
                let numberEnding='';
                if(placeCounter === 1) {
                    numberEnding = 'st'
                } else if(placeCounter === 2) {
                    numberEnding = 'nd'
                } else if(placeCounter === 3) {
                    numberEnding = 'rd'
                }
                message += `\nRight now in ${placeCounter}${numberEnding} place is <@${user.discordId}> with ${totalMiles} ${totalMiles == 1 ? "mile":"miles"}!!!!`;
                placeCounter++;
            }
        }
        const userDiscordId = interaction.user.id;
        const user = await userRepository.findByDiscordId(userDiscordId);
        if(user !== null) {
            const userWalkLoggings = await userWalkLoggingRepository.findUserWalkLogsTotalsByGuildIdUserIdMonthAndYearLimit1(guild.id, user.id, year, month);
            const totals = userWalkLoggings.map(entity => entity.dataValues);
            if(totals.length > 0) {
                const totalMiles = totals[0].total
                message += `\n\n <@${user.discordId}> you currently logged ${totalMiles} ${totalMiles === 1 ? 'mile':'miles'}`
            }
        }
        return message;
    }

    private sortGroupedWalkTotals(groupedTotals: Array<any>) {
        groupedTotals.sort((a,b) => {
            if(a.total < b.total) {
                return 1;
            } else if(a.total > b.total) {
                return -1;
            }
            return 0;
        })
    }
}