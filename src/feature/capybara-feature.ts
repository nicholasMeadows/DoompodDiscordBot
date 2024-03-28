import {Repositories} from "../model/mongo-db-info";
import GuildChannelCronInfo from "../model/guild-channel-cron-info";
import HttpClient from "../http-client";
import DailyCapybaraResponse from "../model/daily-capybara-response";
import {DAILY_CAPYBARA_URL} from "../constants";
import {AttachmentBuilder, ChatInputCommandInteraction, TextChannel} from "discord.js";
import DiscordClient from "../model/discord-client";
import Log from "../log";
import Capybara from "../entity/capybara";
import {ObjectId} from "mongodb";
import User from "../entity/user";
import CapybaraClaim from "../entity/capybara-claim";

export default class CapybaraFeature {
    private _discordClient: DiscordClient;
    private _repositories: Repositories;

    private logger = new Log(this);

    constructor(discordClient: DiscordClient, repositories: Repositories) {
        this._discordClient = discordClient;
        this._repositories = repositories;
    }

    async claimCapybara(interaction: ChatInputCommandInteraction): Promise<{ content: string, files?: any[] }> {
        const guildDiscordId = interaction.guildId;
        if (guildDiscordId === null) {
            this.logger.info(`Claim command was used outside of a guild. Aborting command.`);
            return {
                content: 'This command must be used inside a server.'
            }
        }
        const guildRepo = this._repositories.guildRepository;
        const guildObjectIdObj = await guildRepo.findGuildObjectIdByGuildDiscordId(guildDiscordId).next();
        if (guildObjectIdObj === null) {
            this.logger.info(`guild ${guildDiscordId} was not found in DB.`);
            return {
                content: 'Something went wrong.'
            }
        }
        const guildObjectId = guildObjectIdObj.guildObjectId;
        const userDiscordId = interaction.user.id;

        const userRepo = this._repositories.userRepository;
        let userEntity = await userRepo.findGuildUser(guildObjectId, userDiscordId).next();
        if (userEntity === null) {
            this.logger.info(`User ${userDiscordId} was not found in guild ${guildDiscordId}. Creating user entity`);

            userEntity = new User();
            userEntity.discordUserId = userDiscordId;
            await userRepo.saveGuildUser(guildObjectId, userEntity);
        }
        const claims = await this.findCapybaraClaimsForToday(guildObjectId, userEntity._id);
        if (claims !== undefined && claims.length > 0) {
            this.logger.info('user already claimed a capybara today. aborting command');
            return {
                content: 'You have already claimed your daily capybara. Come back tomorrow!'
            }
        }
        let capybaraObjectIdsAlreadyClaimed: ObjectId[] = [];
        if (userEntity.capybarasClaimed !== undefined) {
            capybaraObjectIdsAlreadyClaimed = userEntity.capybarasClaimed.map(claim => claim.claimedCapybaraObjectId);
        }
        const capybaraRepo = this._repositories.capybaraRepository;
        const capybaraToClaim = await capybaraRepo.findRandomCapybaraForClaim(capybaraObjectIdsAlreadyClaimed).next();
        if (capybaraToClaim === null) {
            this.logger.info('Could not find random capybara');
            return {
                content: 'Sorry. Could not find a capybara to claim.'
            }
        }

        const capybaraUserClaim = new CapybaraClaim();
        capybaraUserClaim.claimedCapybaraObjectId = capybaraToClaim._id;
        const now = new Date();
        let timeOffsetInMS: number = now.getTimezoneOffset() * 60000;
        now.setTime(now.getTime() - timeOffsetInMS);
        capybaraUserClaim.claimedOn = now;

        if (userEntity.capybarasClaimed === undefined) {
            userEntity.capybarasClaimed = [];
        }
        userEntity.capybarasClaimed.push(capybaraUserClaim);
        await userRepo.saveGuildUser(guildObjectId, userEntity);

        let imgBuffer: Buffer | undefined = await this.fetchCapybaraImgBuffer(capybaraToClaim, new Date());
        if (imgBuffer === undefined) {
            this.logger.warn('Failed to fetch image buffer from db and url. Aborting cron.');
            return {
                content: 'Something went wrong while claiming capybera'
            }
        }
        return {
            content: `<@${userDiscordId}> You claimed: \n${this.createCapybaraStr(capybaraToClaim)}`,
            files: [imgBuffer]
        }
    }

    async sendDailyCapybaraCron(guildChannelCronInfo: GuildChannelCronInfo) {
        const channelDiscordId = guildChannelCronInfo.channelDiscordId;
        const discordChannel = await this._discordClient.channels.fetch(channelDiscordId);
        if (discordChannel === null) {
            this.logger.warn(`discord client returned null when fetching channel with discord id ${channelDiscordId}`);
            return;
        }

        const capybaraRepo = this._repositories.capybaraRepository;
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        let capybaraEntity = await this._repositories.capybaraRepository.findCapybaraByCreatedOn(startDate, endDate).next();

        if (capybaraEntity === null) {
            this.logger.info(`capybara entity was not found in DB for ${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}. Fetching data from site.`);
            const dailyCapybaraResponse = await this.fetchDailyCapybara();
            if (dailyCapybaraResponse === undefined) {
                this.logger.warn('Failed to fetch daily capybara info aborting this cron run.');
                return;
            }
            this.logger.info(`fetched capybara info. Mapping to entity and saving to DB.`);
            const entity = this.mapDailyCapybaraResponseToEntity(dailyCapybaraResponse);
            await capybaraRepo.saveCapybara(entity);
            capybaraEntity = entity;
            this.logger.info('Saved capybara info to DB');
        }

        let imgBuffer: Buffer | undefined = await this.fetchCapybaraImgBuffer(capybaraEntity, now);
        if (imgBuffer === undefined) {
            this.logger.warn('Failed to fetch image buffer from db and url. Aborting cron.');
            return;
        }

        (discordChannel as TextChannel).send({
            content: this.createCapybaraStr(capybaraEntity),
            files: [new AttachmentBuilder(imgBuffer)]
        })
    }

    async fetchCapybaraImgBuffer(capybaraEntity: Capybara, now: Date) {
        const capybaraRepo = this._repositories.capybaraRepository;
        if (capybaraEntity.imageObjectId !== undefined) {
            this.logger.info(`capybara entity _id: ${capybaraEntity._id} has image object id ${capybaraEntity.imageObjectId}`)
            const foundImgBuffer = await capybaraRepo.findCapybaraImageByObjectId(capybaraEntity.imageObjectId)
            if (foundImgBuffer !== undefined) {
                this.logger.info(`successfully pulled capybara image from db.`)
                return foundImgBuffer;
            }
        }

        this.logger.info(`image buffer is undefined after checking image object id and DB. Fetching from url stored on entity. ${capybaraEntity.imageUrl}`)
        const dailyCapybaraImgBuffer = await this.fetchDailyCapybaraImg(capybaraEntity.imageUrl);
        if (dailyCapybaraImgBuffer === undefined) {
            this.logger.warn(`Failed to fetch daily capybara image buffer. Aborting this cron run.`);
            return;
        }
        this.logger.info(`got capybara image buffer. Saving to DB and entity.`)
        const fileName = `capybara-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        capybaraEntity.imageObjectId = capybaraRepo.saveCapybaraImage(fileName, dailyCapybaraImgBuffer);
        await capybaraRepo.saveCapybara(capybaraEntity);
        return dailyCapybaraImgBuffer;
    }

    private createCapybaraStr(capybaraEntity: Capybara) {
        return `Name: ${capybaraEntity.name}\n` +
            `Class: ${capybaraEntity.class}\n` +
            `Muncher lvl: ${capybaraEntity.muncherLvl}\n` +
            `Relationship status: ${capybaraEntity.relationshipStatus}\n` +
            `Weapon of choice: ${capybaraEntity.weapon}\n`
    }

    async fetchDailyCapybara() {
        const httpClient = new HttpClient();
        try {
            return await httpClient.request<DailyCapybaraResponse>(DAILY_CAPYBARA_URL, {
                method: 'GET',
                headers: {
                    Accept: 'application.json',
                    'Content-Type': 'application/json'
                }
            });
        } catch (e) {
            this.logger.warn(`Failed to get capybara from ${DAILY_CAPYBARA_URL}`, e);
            return undefined;
        }
    }

    async fetchDailyCapybaraImg(url: string) {
        try {
            const imageResponse = await fetch(url);
            const imageArrayBuffer = await imageResponse.arrayBuffer();
            return Buffer.from(imageArrayBuffer)
        } catch (e) {
            this.logger.warn(`Failed to fetch daily capybara image at url ${url}`);
        }
    }

    private mapDailyCapybaraResponseToEntity(dailyCapybaraResponse: DailyCapybaraResponse) {
        const capybaraEntity = new Capybara();
        capybaraEntity.imageUrl = dailyCapybaraResponse.image;
        capybaraEntity.class = dailyCapybaraResponse.class;
        capybaraEntity.name = dailyCapybaraResponse.name;
        capybaraEntity.daysAgo = dailyCapybaraResponse.days_ago;
        capybaraEntity.muncherLvl = dailyCapybaraResponse.muncher_lvl;
        capybaraEntity.relationshipStatus = dailyCapybaraResponse.relationship_status;
        capybaraEntity.used = dailyCapybaraResponse.used;
        capybaraEntity.weapon = dailyCapybaraResponse.weapon;
        return capybaraEntity;
    }

    async findCapybaraClaimsForToday(guildObjectId: ObjectId, userObjectId: ObjectId) {
        const now = new Date();
        let timeOffsetInMS: number = now.getTimezoneOffset() * 60000;
        now.setTime(now.getTime() - timeOffsetInMS);
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return await this._repositories.capybaraRepository.findCapybarasClaimedBetweenDatesForGuildUser(guildObjectId, userObjectId, startDate, endDate).toArray();
    }
}