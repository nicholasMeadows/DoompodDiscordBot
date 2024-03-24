import {ObjectId} from "mongodb";

export default class MinecraftReference {
    declare _id: ObjectId;
    declare referencedByUserObjectId: ObjectId;
    declare referenceMadeTimestamp: Date;

    constructor() {
        this._id = new ObjectId();
    }
}