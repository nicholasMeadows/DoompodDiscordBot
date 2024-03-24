import cron, {ScheduledTask} from "node-cron";
import DiscordClient from "../model/discord-client";
import {Repositories} from "../model/mongo-db-info";
import GuildChannelCronInfo from "../model/guild-channel-cron-info";
import CronAction from "../model/enum/cron-action";
import {TextChannel} from "discord.js";
import WalkCompetitionFeature from "./walk-competition-feature";

export default class BotCronManager {
    private _discordClient: DiscordClient;
    private _repositories: Repositories;
    private _crons: Array<ScheduledTask>;

    constructor(discordClient: DiscordClient, repositories: Repositories) {
        this._discordClient = discordClient;
        this._repositories = repositories;
        this._crons = new Array<ScheduledTask>();
    }

    async setupCrons() {
        console.log("Setting up crons");
        this.clearExistingCrons();
        const guildChannelCronInfos = await this._repositories.guildRepository.findAllGuildChannelCronInfo().toArray();

        for (const guildChannelCronInfo of guildChannelCronInfos) {
            const execute = () => {
                this.handleCronExecution(guildChannelCronInfo);
            }
            const task = cron.schedule(guildChannelCronInfo.channelCron.cronSchedule.schedule, execute);
            this._crons.push(task);
        }
    }

    private clearExistingCrons() {
        console.log("Clearing existing crons");
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
        }
    }

    private async sendMediaOrStickerCron(guildChannelCronInfo: GuildChannelCronInfo) {
        console.log(`Running cron "${guildChannelCronInfo.channelCron.name}"`)
        const channelDiscordId = guildChannelCronInfo.channelDiscordId;
        const discordChannel = await this._discordClient.channels.fetch(channelDiscordId);
        if (discordChannel === null) {
            console.log(`Discord channel id ${channelDiscordId} was not found in discord API`);
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
        if (paths.length == 0 && stickerDiscordIds) {
            console.log(`No content to send in message for cron ${guildChannelCronInfo.channelCron.name}`);
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
}