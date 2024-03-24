import {ObjectId} from "mongodb";

export default class HallOfDootConfig {
    declare _id: ObjectId;
    declare requiredNumberOfReactions: number;
    declare hallOfDootChannelObjectId: ObjectId;

    constructor() {
        this._id = new ObjectId();
    }
}