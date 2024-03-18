import Guild from "../entity/guild";
import Cron from "../entity/cron";
import cron, {ScheduledTask} from "node-cron";
import DiscordClient from "../model/discord-client";
import {TextChannel} from "discord.js";
import Channel from "../entity/channel";
import Sticker from "../entity/sticker";
import BotAsset from "../entity/bot-asset";
import CronAction from "../model/enum/cron-action";
import UserWalkLoggingRepository from "../repository/user-walk-logging-repository";
import GuildRepository from "../repository/guild-repository";
import ChannelRepository from "../repository/channel-repository";
import UserRepository from "../repository/user-repository";
import WalkCompetitionFeature from "./walk-competition-feature";

export default class BotCronManager {
    private _discordClient: DiscordClient;
    private _crons: Array<ScheduledTask>;

    constructor(discordClient: DiscordClient) {
        this._discordClient = discordClient;
        this._crons = new Array<ScheduledTask>();
    }

    setupCrons() {
        console.log("Setting up crons");
        this.clearExistingCrons();
        Cron.findAll({
            include: [{
                model: Guild,
                required: true,
            }, {
                model: Channel,
                required: true
            }, {
                model: Sticker,
                required: false
            },{
                model: BotAsset,
                required: false
            }]
        }).then(cronEntities => {
            console.log(`Got ${cronEntities.length} crons`)
            cronEntities.forEach(cronEntity => {
                const execute = () => {
                    switch (cronEntity.action) {
                        case CronAction.SEND_MEDIA:
                        case CronAction.SEND_STICKER:this.handleSendMediaSendStickerCronExecution(cronEntity);
                            break;
                        case CronAction.POST_WALKING_RESULTS: this.handlePostWalkingResultsCron(cronEntity);
                            break;
                    }
                }
                const task = cron.schedule(cronEntity.schedule, execute);
                this._crons.push(task);
            })
        });
    }

    private clearExistingCrons() {
        console.log("Clearing existing crons");
        this._crons.forEach(cron => {
            cron.stop();
        });
        this._crons = new Array<ScheduledTask>();
    }

    private handleSendMediaSendStickerCronExecution(cronEntity: Cron) {
        console.log(`Running cron "${cronEntity.name}"`)
        const guildId = cronEntity.guild.discordId
        this._discordClient.guilds.fetch(guildId).then(guild => {
            if(guild === undefined) {
                console.log(`Guild for ${cronEntity.name} was undefined`);
                return;
            }
            const channelId = cronEntity.channel.discordId;
            guild.channels.fetch(channelId).then(channel => {
                if(channel === null) {
                    console.log(`Channel for ${cronEntity.name} was undefined`);
                    return;
                }

                console.log("stickers", cronEntity.stickers)
                console.log("assets", cronEntity.assets)

                const stickers = cronEntity.stickers;
                let stickerIds = new Array<string> ();
                if(stickers !== undefined) {
                    stickerIds = stickers.map(sticker => sticker.stickerId)
                }

                const assets = cronEntity.assets;
                let attachmentPaths = new Array<string> ();
                if(assets !== undefined) {
                    attachmentPaths = assets.map(asset => asset.path)
                }

                if(assets === undefined && stickers === undefined) {
                    console.log(`Cron ${cronEntity.name} did not have any attachments or stickers. Not sending anything.`)
                    return;
                }

                console.log(`Sending sticker ids ${stickerIds} and attachments ${attachmentPaths} for cron name: ${cronEntity.name}`);
                (channel as TextChannel).send({
                    files: attachmentPaths,
                    stickers: stickerIds
                })
            })
        })
    }

    private async handlePostWalkingResultsCron(cronEntity: Cron) {
        const walkCompetitionFeature = new WalkCompetitionFeature(this._discordClient);
        walkCompetitionFeature.handlePostWalkingResultsCron(cronEntity);
    }
}