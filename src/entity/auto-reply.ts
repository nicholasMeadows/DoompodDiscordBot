import {ObjectId} from "mongodb";
import AutoReplyTrigger from "../model/enum/auto-reply-trigger";

export default class AutoReply {
    declare _id: ObjectId;
    declare name: string;
    declare replyChancePercentage: number;
    declare triggerType: AutoReplyTrigger;
    declare triggerTerms: string[];
    declare requiredReactionsForReply: {
        reactionKey: string,
        reactionCount: number
    }[]
    declare replyWithText: string;
    declare replyWithAssets: ObjectId[];
    declare replyWithStickers: ObjectId[];

    constructor() {
        this._id = new ObjectId();
    }
}