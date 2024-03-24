import {ObjectId} from "mongodb";
import CronAction from "./enum/cron-action";
import CronSchedule from "../entity/cron-schedule";
import Sticker from "../entity/sticker";
import BotAsset from "../entity/bot-asset";

export default interface GuildChannelCronInfo {
    guildObjectId: ObjectId;
    guildDiscordId: string;
    channelObjectId: ObjectId;
    channelDiscordId: string;
    channelCron: {
        channelCronObjectId: ObjectId;
        cronAction: CronAction;
        cronSchedule: CronSchedule;
        name: string;
        botAssets: BotAsset[];
        stickers: Sticker[];
    }
}