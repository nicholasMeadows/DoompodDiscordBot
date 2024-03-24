import {ObjectId} from "mongodb";
import AutoReplyTrigger from "./enum/auto-reply-trigger";
import BotAsset from "../entity/bot-asset";
import Sticker from "../entity/sticker";

export default interface AutoReplyInfo {
    _id: ObjectId;
    name: string;
    replyChancePercentage: number
    triggerType: AutoReplyTrigger;
    triggerTerms: string[];
    requiredReactionsForReply: {
        reactionKey: string,
        reactionCount: number
    }[],
    replyWithText: string;
    replyWithAssets: BotAsset[],
    replyWithStickers: Sticker[],
    randomizeAttachmentsSent: boolean
}