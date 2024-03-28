import {ObjectId} from "mongodb";

export default class CapybaraClaim {
    declare _id: ObjectId;
    declare claimedOn: Date;
    declare claimedCapybaraObjectId: ObjectId;

    constructor() {
        this._id = new ObjectId();
        this.claimedOn = new Date();
    }
}