import BotCron from "../feature/bot-cron";
import AutoReplyFeature from "../feature/auto-reply-feature";
import HallOfDootFeature from "../feature/hall-of-doot-feature";
import MinecraftReference from "../entity/minecraft-reference";
import MinecraftReferenceFeature from "../feature/minecraft-reference-feature";

export default interface FeatureClassesObj {
    botCron: BotCron;
    autoReplyFeature: AutoReplyFeature
    hallOfDootFeature: HallOfDootFeature
    minecraftReferenceFeature: MinecraftReferenceFeature
}