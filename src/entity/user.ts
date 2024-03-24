import {ObjectId} from "mongodb";

export default class User {
    declare _id: ObjectId;
    declare discordUserId: string;

    constructor() {
        this._id = new ObjectId();
    }
}