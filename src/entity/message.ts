import {ObjectId} from "mongodb";

export default class Message {
    declare _id: ObjectId;
    declare discordId: string;
    declare sentToHallOfDoot: boolean;
    declare repliedToByAutoReplyObjectIds: ObjectId[];

    constructor() {
        this._id = new ObjectId();
    }
}