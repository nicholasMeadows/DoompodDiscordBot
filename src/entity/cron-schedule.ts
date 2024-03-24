import {ObjectId} from "mongodb";

export default class CronSchedule {
    declare _id: ObjectId;
    declare name: string;
    declare schedule: string;

    constructor() {
        this._id = new ObjectId();
    }
}