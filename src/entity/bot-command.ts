import {ObjectId} from "mongodb";

export default class BotCommand {
    declare _id: ObjectId;
    declare discordId: string;
    declare commandName: string;
    declare commandDescription: string;

    constructor() {
        this._id = new ObjectId();
    }
}