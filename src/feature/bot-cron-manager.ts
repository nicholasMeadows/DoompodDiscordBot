import cron, {ScheduledTask} from "node-cron";
import DiscordClient from "../model/discord-client";
import {Repositories} from "../model/mongo-db-info";
import GuildChannelCronInfo from "../model/guild-channel-cron-info";
import CronAction from "../model/enum/cron-action";
import {AttachmentBuilder, TextChannel} from "discord.js";
import WalkCompetitionFeature from "./walk-competition-feature";
import Log from "../log";
import {DAILY_CAPYBARA_URL} from "../constants";
import DailyCapybaraResponse from "../model/daily-capybara-response";
import HttpClient from "../http-client";

export default class BotCronManager {
    private _discordClient: DiscordClient;
    private _repositories: Repositories;
    private _crons: Array<ScheduledTask>;

    private logger = new Log(this);

    constructor(discordClient: DiscordClient, repositories: Repositories) {
        this._discordClient = discordClient;
        this._repositories = repositories;
        this._crons = new Array<ScheduledTask>();
    }

    async setupCrons() {
        this.logger.info("Setting up crons");
        const guildChannelCronInfos = await this._repositories.guildRepository.findAllGuildChannelCronInfo().toArray();

        for (const guildChannelCronInfo of guildChannelCronInfos) {
            const execute = () => {
                this.handleCronExecution(guildChannelCronInfo);
            }
            const task = cron.schedule(guildChannelCronInfo.channelCron.cronSchedule.schedule, execute);
            this._crons.push(task);
        }
    }

    clearExistingCrons() {
        this.logger.info("Clearing existing crons");
        this._crons.forEach(cron => {
            cron.stop();
        });
        this._crons = new Array<ScheduledTask>();
    }

    private handleCronExecution(guildChannelCronInfo: GuildChannelCronInfo) {
        const cronAction = guildChannelCronInfo.channelCron.cronAction;
        switch (cronAction) {
            case CronAction.SEND_STICKER:
            case CronAction.SEND_MEDIA:
                this.sendMediaOrStickerCron(guildChannelCronInfo);
                break;
            case CronAction.POST_WALKING_RESULTS:
                this.handlePostWalkingResultsCron(guildChannelCronInfo);
                break;
            case CronAction.DAILY_CAPYBARA:
                this.handleDailyCapybara(guildChannelCronInfo);
                break;
        }
    }

    private async sendMediaOrStickerCron(guildChannelCronInfo: GuildChannelCronInfo) {
        this.logger.info(`Running cron "${guildChannelCronInfo.channelCron.name}"`)
        const channelDiscordId = guildChannelCronInfo.channelDiscordId;
        const discordChannel = await this._discordClient.channels.fetch(channelDiscordId);
        if (discordChannel === null) {
            this.logger.error(`Discord channel id ${channelDiscordId} was not found in discord API`);
            return;
        }

        const paths: string[] = []
        const botAssets = guildChannelCronInfo.channelCron.botAssets
        if (botAssets !== undefined && botAssets.length > 0) {
            paths.push(...botAssets.map(botAsset => botAsset.path))
        }

        const stickerDiscordIds: string[] = [];
        const stickers = guildChannelCronInfo.channelCron.stickers;
        if (stickers !== undefined && stickers.length > 0) {
            stickerDiscordIds.push(...stickers.map(sticker => sticker.discordId));
        }
        if (paths.length == 0 && stickerDiscordIds.length == 0) {
            this.logger.error(`No content to send in message for cron ${guildChannelCronInfo.channelCron.name}`);
            return;
        }
        await (discordChannel as TextChannel).send({
            files: paths,
            stickers: stickerDiscordIds
        })
    }

    private async handlePostWalkingResultsCron(guildChannelCronInfo: GuildChannelCronInfo) {
        const walkCompetitionFeature = new WalkCompetitionFeature(this._discordClient, this._repositories);
        walkCompetitionFeature.handlePostWalkingResultsCron(guildChannelCronInfo);
    }

    private async handleDailyCapybara(guildChannelCronInfo: GuildChannelCronInfo) {
        const channelDiscordId = guildChannelCronInfo.channelDiscordId;
        const discordChannel = await this._discordClient.channels.fetch(channelDiscordId);
        if (discordChannel === null) {
            this.logger.warn(`discord client returned null when fetching channel with discord id ${channelDiscordId}`);
            return;
        }

        const httpClient = new HttpClient();
        let dailyCapybaraResponse: DailyCapybaraResponse | undefined = undefined;
        try {
            dailyCapybaraResponse = await httpClient.request<DailyCapybaraResponse>(DAILY_CAPYBARA_URL, {
                method: 'GET',
                headers: {
                    Accept: 'application.json',
                    'Content-Type': 'application/json'
                }
            })
        } catch (e) {
            this.logger.warn(`Failed to get capybara from ${DAILY_CAPYBARA_URL}`, e);
            return;
        }

        let imageResponse: Response | undefined = undefined;
        try {
            imageResponse = await fetch(dailyCapybaraResponse.image);
        } catch (e) {
            this.logger.warn(`Failed to fetch daily capybara image at url ${dailyCapybaraResponse.image}`);
        }
        let files = [];
        if (imageResponse !== undefined) {
            const imageArrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(imageArrayBuffer);
            files.push(new AttachmentBuilder(buffer));
        }

        await (discordChannel as TextChannel).send({
            content: `Name: ${dailyCapybaraResponse.name}\n` +
                `Class: ${dailyCapybaraResponse.class}\n` +
                `Muncher lvl: ${dailyCapybaraResponse.muncher_lvl}\n` +
                `Relationship status: ${dailyCapybaraResponse.relationship_status}\n` +
                `Weapon of choice: ${dailyCapybaraResponse.weapon}\n`,
            files: files
        })
    }
}