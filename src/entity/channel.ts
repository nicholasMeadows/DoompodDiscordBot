import {ObjectId} from "mongodb";
import ChannelCron from "./channel-cron";
import Message from "./message";

export default class Channel {
    declare _id: ObjectId;
    declare discordId: string;
    declare channelCrons: ChannelCron[];
    declare messages: Message[];

    constructor() {
        this._id = new ObjectId();
    }
}