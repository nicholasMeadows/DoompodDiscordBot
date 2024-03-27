import BotCronManager from "../feature/bot-cron-manager";
import HallOfDootFeature from "../feature/hall-of-doot-feature";
import AutoReplyFeature from "../feature/auto-reply-feature";
import MinecraftReferenceFeature from "../feature/minecraft-reference-feature";
import CapybaraFeature from "../feature/capybara-feature";

export default interface FeatureClassesObj {
    botCronManager: BotCronManager;
    autoReplyFeature: AutoReplyFeature
    hallOfDootFeature: HallOfDootFeature
    minecraftReferenceFeature: MinecraftReferenceFeature
    capybaraFeature: CapybaraFeature;
}