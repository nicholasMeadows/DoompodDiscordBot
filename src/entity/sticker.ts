import {ObjectId} from "mongodb";

export default class Sticker {
    declare _id: ObjectId;
    declare guildObjectId: ObjectId;
    declare discordId: string;

    constructor() {
        this._id = new ObjectId();
    }
}