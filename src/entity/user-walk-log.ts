import {ObjectId} from "mongodb";

export default class UserWalkLog {
    declare _id: ObjectId
    declare user: ObjectId
    declare milesLogged: number;
    declare createdAt: Date

    constructor() {
        this._id = new ObjectId()
        this.createdAt = new Date();
    }
}