import MongoDbInfo from "./model/mongo-db-info";
import BotAsset from "./entity/bot-asset";
import BotAssetType from "./model/enum/bot-asset-type";
import CronSchedule from "./entity/cron-schedule";
import Channel from "./entity/channel";
import AutoReply from "./entity/auto-reply";
import Guild from "./entity/guild";
import {ObjectId} from "mongodb";
import Sticker from "./entity/sticker";
import ChannelCron from "./entity/channel-cron";
import Message from "./entity/message";
import CronAction from "./model/enum/cron-action";
import cronAction from "./model/enum/cron-action";
import AutoReplyTrigger from "./model/enum/auto-reply-trigger";
import HallOfDootConfig from "./entity/hall-of-doot-config";
import Log from "./log";

export default class LoadDevData {
    declare mongoDbInfo: MongoDbInfo;
    private logger = new Log(this);

    constructor(mongoDbInfo: MongoDbInfo) {
        this.mongoDbInfo = mongoDbInfo;
    }

    async loadDevData() {
        this.logger.info('testing load dev');
        await this.mongoDbInfo.db.dropDatabase({dbName: "doombot"});

        const assets = await this.createAndSaveBotAssets();
        const cronSchedules = await this.saveCronSchedules();
        await this.loadFluffyData(assets, cronSchedules);
        await this.loadDoompodData(assets, cronSchedules);

    }

    async saveCronSchedules() {
        const cronSchedules = {
            daily8AMSchedule: this.createCronSchedule("Daily @ 8 AM", "0 8 * * *"),
            wednesday9AMSchedule: this.createCronSchedule("Wednesday @ 9 AM", "0 9 * * 3"),
            friday9AMSchedule: this.createCronSchedule("Friday @ 9 AM", "0 9 * * 5"),
            friday5PMSchedule: this.createCronSchedule("Friday @ 5 PM", "0 17 * * 5")
        }
        const cronScheduleRepository = this.mongoDbInfo.repositories.cronScheduleRepository;
        await cronScheduleRepository.saveCronSchedule(cronSchedules.daily8AMSchedule);
        await cronScheduleRepository.saveCronSchedule(cronSchedules.wednesday9AMSchedule);
        await cronScheduleRepository.saveCronSchedule(cronSchedules.friday9AMSchedule);
        await cronScheduleRepository.saveCronSchedule(cronSchedules.friday5PMSchedule);
        return cronSchedules;
    }

    async loadFluffyData(assets: any, cronSchedules: any) {
        const guildStickerRepository = this.mongoDbInfo.repositories.guildStickerRepository
        const guildRepository = this.mongoDbInfo.repositories.guildRepository;

        const fluffyServer = this.createGuild("Fluffys Server", "107567358805032960", undefined, undefined);

        const fluffySticker = this.createSticker("1190511964535914617", fluffyServer._id);

        const fluffySucketChannelCron = this.createChannelCron(cronAction.SEND_STICKER, cronSchedules.daily8AMSchedule._id, "Fluffy Sucklet", [fluffySticker._id], undefined)
        const fluffyItsWednesdayMyDudeChannelCron = this.createChannelCron(cronAction.SEND_MEDIA, cronSchedules.wednesday9AMSchedule._id, "Fluffy its wend my dude", undefined, [assets.itsWednesdayMyDudes._id])
        const fluffyItsFridayInCaliforniaChannelCron = this.createChannelCron(cronAction.SEND_MEDIA, cronSchedules.friday9AMSchedule._id, "Fluffy its friday in california", undefined, [assets.todayIsFridayInCalifornia._id])
        const fluffyLadiesAndGentlemenTheWeekendChannelCron = this.createChannelCron(cronAction.SEND_MEDIA, cronSchedules.friday5PMSchedule._id, "Fluffy ladies and gents its the weekend", undefined, [assets.ladiesAndGentlmenTheWeekend._id]);

        const sandboxChannel1TestMessage = this.createMessage('1219852669879976017');
        const sandboxChannel2TestMessage = this.createMessage('1219852723332190318');

        const sandboxChannel1 = this.createChannel("1219841286870405254", [sandboxChannel1TestMessage], [fluffySucketChannelCron, fluffyItsWednesdayMyDudeChannelCron, fluffyItsFridayInCaliforniaChannelCron, fluffyLadiesAndGentlemenTheWeekendChannelCron]);
        const sandboxChannel2 = this.createChannel("1219841332969869403", [sandboxChannel2TestMessage], undefined);

        const randomActuallyReply = this.createAutoReply("Random Actually Reply", 10, AutoReplyTrigger.MESSAGE_CONTENT,
            ['actually'], undefined, undefined, undefined, [
                assets.randomActuallyReply._id]);

        const bonkReply = this.createAutoReply("Bonk Reply", 100, AutoReplyTrigger.MESSAGE_REACTION,
            undefined, [{reactionKey: '🔨', reactionCount: 1}], undefined, [fluffySticker._id], [
                assets.bonk._id]);

        fluffyServer.hallOfDootConfig = this.createHallOfDootConfig(sandboxChannel2._id, 1);
        fluffyServer.walkLoggingCompetitionResultsChannelObjectId = sandboxChannel1._id;
        fluffyServer.autoReplies = [randomActuallyReply, bonkReply];
        fluffyServer.channels = [sandboxChannel1, sandboxChannel2];
        await guildRepository.saveGuild(fluffyServer);
        await guildStickerRepository.saveSticker(fluffySticker);
    }

    async loadDoompodData(assets: any, cronSchedules: any) {
        const guildStickerRepository = this.mongoDbInfo.repositories.guildStickerRepository
        const guildRepository = this.mongoDbInfo.repositories.guildRepository;

        const doompodServer = this.createGuild("Doompod", "1143928433093652570", undefined, undefined);

        const doompodSucklet = this.createSticker("1153012585680085024", doompodServer._id);


        const doompodSuckletChannelCron = this.createChannelCron(cronAction.SEND_STICKER, cronSchedules.daily8AMSchedule._id, "Doompod Sucklet", [doompodSucklet._id], undefined)
        const doompodItsWednesdayMyDudeChannelCron = this.createChannelCron(cronAction.SEND_MEDIA, cronSchedules.wednesday9AMSchedule._id, "Doompod its Wednesday My Dudes", undefined, [assets.itsWednesdayMyDudes._id])
        const doompodItsFridayInCaliforniaChannelCron = this.createChannelCron(cronAction.SEND_MEDIA, cronSchedules.friday9AMSchedule._id, "Doompod today is friday in california", undefined, [assets.todayIsFridayInCalifornia._id])
        const doompodLadiesAndGentlemenTheWeekendChannelCron = this.createChannelCron(cronAction.SEND_MEDIA, cronSchedules.friday5PMSchedule._id, "Doompod ladies and gentlemen the weekend", undefined, [assets.ladiesAndGentlmenTheWeekend._id]);

        const doompodGeneral = this.createChannel("1143928433596960870", undefined, [doompodSuckletChannelCron, doompodItsWednesdayMyDudeChannelCron, doompodItsFridayInCaliforniaChannelCron, doompodLadiesAndGentlemenTheWeekendChannelCron]);
        const doompodHallOfDoot = this.createChannel("1210619833952112691", undefined, undefined);
        doompodServer.channels = [doompodGeneral, doompodHallOfDoot];

        await guildRepository.saveGuild(doompodServer);
        await guildStickerRepository.saveSticker(doompodSucklet);
    }

    async createAndSaveBotAssets() {
        const assets = {
            bonk: this.createBotAsset(BotAssetType.AUDIO, "./assets/audio/bonk.mp3"),
            doompodHug1: this.createBotAsset(BotAssetType.IMAGE, "./assets/image/doompod-hug1-2023.gif"),
            doompodHug2: this.createBotAsset(BotAssetType.IMAGE, "./assets/image/doompod-hug2-2023.gif"),
            doompodKatieLetsGo: this.createBotAsset(BotAssetType.IMAGE, "./assets/image/doompod-katie-letsgo-2023.gif"),
            doompodTrishake: this.createBotAsset(BotAssetType.IMAGE, "./assets/image/doompod-trishake-2023.gif"),
            randomActuallyReply: this.createBotAsset(BotAssetType.IMAGE, "./assets/image/random-actually-reply.gif"),
            itsWednesdayMyDudes: this.createBotAsset(BotAssetType.VIDEO, "./assets/video/It Is Wednesday My Dudes.mp4"),
            ladiesAndGentlmenTheWeekend: this.createBotAsset(BotAssetType.VIDEO, "./assets/video/ladies and gentlemen the weekend.mp4"),
            todayIsFridayInCalifornia: this.createBotAsset(BotAssetType.VIDEO, "./assets/video/Today is Friday in California.mp4")
        }

        const botAssetRepository = this.mongoDbInfo.repositories.botAssetRepository;

        const entries = Object.entries(assets);
        for (const [key, value] of entries) {
            await botAssetRepository.saveBotAsset(value);
        }
        return assets;
    }

    createBotAsset(botAssetType: BotAssetType, path: string) {
        const botAsset = new BotAsset();
        botAsset.path = path;
        botAsset.assetType = botAssetType;
        return botAsset;
    }

    createCronSchedule(name: string, schedule: string) {
        const cronSchedule = new CronSchedule();
        cronSchedule.name = name;
        cronSchedule.schedule = schedule;
        return cronSchedule;
    }

    createGuild(name: string, discordId: string, channels: Channel[] | undefined, autoReplies: AutoReply[] | undefined) {
        const guild = new Guild();
        guild.name = name;
        guild.discordId = discordId;
        if (channels !== undefined) {
            guild.channels = channels;
        }
        if (autoReplies !== undefined) {
            guild.autoReplies = autoReplies
        }
        return guild;
    }

    createChannel(discordId: string, messages: Message[] | undefined, channelCrons: ChannelCron[] | undefined) {
        const channel = new Channel();
        channel.discordId = discordId;
        if (messages !== undefined) {
            channel.messages = messages;
        }
        if (channelCrons !== undefined) {
            channel.channelCrons = channelCrons;
        }
        return channel;
    }

    createMessage(discordId: string) {
        const message = new Message();
        message.discordId = discordId;
        return message;
    }

    createChannelCron(cronAction: CronAction, cronScheduleObjectId: ObjectId, name: string, stickerObjectIds: ObjectId[] | undefined, botAssetsObjectIds: ObjectId[] | undefined) {
        const channelCron = new ChannelCron();
        channelCron.cronAction = cronAction;
        channelCron.cronScheduleObjectId = cronScheduleObjectId;
        channelCron.name = name;
        if (stickerObjectIds !== undefined) {
            channelCron.stickerObjectIds = stickerObjectIds;
        }
        if (botAssetsObjectIds !== undefined) {
            channelCron.botAssetsObjectIds = botAssetsObjectIds;
        }
        return channelCron;
    }

    createSticker(stickerDiscordId: string, guildObjectId: ObjectId) {
        const sticker = new Sticker();
        sticker.discordId = stickerDiscordId;
        sticker.guildObjectId = guildObjectId;
        return sticker;
    }

    createAutoReply(name: string, replyChancePercentage: number, triggerType: AutoReplyTrigger, triggerTerms: string[] | undefined,
                    requiredReactionsForReply: { reactionKey: string, reactionCount: number }[] | undefined,
                    replyWithText: string | undefined, replyWithStickers: ObjectId[] | undefined, replyWithAssets: ObjectId[] | undefined) {
        const autoReply = new AutoReply();
        autoReply.name = name;
        autoReply.replyChancePercentage = replyChancePercentage;
        autoReply.triggerType = triggerType;
        if (triggerTerms !== undefined) {
            autoReply.triggerTerms = triggerTerms;
        }

        if (requiredReactionsForReply !== undefined) {
            autoReply.requiredReactionsForReply = requiredReactionsForReply;
        }

        if (replyWithText !== undefined) {
            autoReply.replyWithText = replyWithText;
        }

        if (replyWithAssets !== undefined) {
            autoReply.replyWithAssets = replyWithAssets;
        }
        if (replyWithStickers !== undefined) {
            autoReply.replyWithStickers = replyWithStickers;
        }
        return autoReply;
    }

    createHallOfDootConfig(hallOfDootChannelObjectId: ObjectId, requiredNumberOfReactions: number) {
        const hallOfDootConfig = new HallOfDootConfig();
        hallOfDootConfig.hallOfDootChannelObjectId = hallOfDootChannelObjectId;
        hallOfDootConfig.requiredNumberOfReactions = requiredNumberOfReactions;
        return hallOfDootConfig;
    }
}
