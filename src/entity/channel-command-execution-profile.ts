import {ObjectId} from "mongodb";

export default class ChannelCommandExecutionProfile {
    declare _id: ObjectId;
    declare botCommandObjectId: ObjectId;
    declare allowedChannelDiscordIds: string[];
    declare notAllowedChannelDiscordIds: string[];

    constructor() {
        this._id = new ObjectId();
    }
}