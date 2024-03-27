import {Repositories} from "../model/mongo-db-info";
import GuildChannelCronInfo from "../model/guild-channel-cron-info";
import HttpClient from "../http-client";
import DailyCapybaraResponse from "../model/daily-capybara-response";
import {DAILY_CAPYBARA_URL} from "../constants";
import {AttachmentBuilder, TextChannel} from "discord.js";
import DiscordClient from "../model/discord-client";
import Log from "../log";
import Capybara from "../entity/capybara";

export default class CapybaraFeature {
    private _discordClient: DiscordClient;
    private _repositories: Repositories;

    private logger = new Log(this);

    constructor(discordClient: DiscordClient, repositories: Repositories) {
        this._discordClient = discordClient;
        this._repositories = repositories;
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

        let imgBuffer: Buffer | undefined = undefined;
        if (capybaraEntity.imageObjectId !== undefined) {
            this.logger.info(`capybara entity _id: ${capybaraEntity._id} has image object id ${capybaraEntity.imageObjectId}`)
            const foundImgBuffer = await capybaraRepo.findCapybaraImageByObjectId(capybaraEntity.imageObjectId)
            if (foundImgBuffer !== undefined) {
                this.logger.info(`successfully pulled capybara image from db.`)
                imgBuffer = foundImgBuffer;
            }
        }

        if (imgBuffer === undefined) {
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
            imgBuffer = dailyCapybaraImgBuffer;
        }

        (discordChannel as TextChannel).send({
            content: `Name: ${capybaraEntity.name}\n` +
                `Class: ${capybaraEntity.class}\n` +
                `Muncher lvl: ${capybaraEntity.muncherLvl}\n` +
                `Relationship status: ${capybaraEntity.relationshipStatus}\n` +
                `Weapon of choice: ${capybaraEntity.weapon}\n`,
            files: [new AttachmentBuilder(imgBuffer)]
        })
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
}