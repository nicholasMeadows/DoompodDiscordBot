import {ObjectId} from "mongodb";
import CronAction from "../model/enum/cron-action";

export default class ChannelCron {
    declare _id: ObjectId;
    declare cronAction: CronAction;
    declare name: string;
    declare cronScheduleObjectId: ObjectId;
    declare botAssetsObjectIds: ObjectId[];
    declare stickerObjectIds: ObjectId[];

    constructor() {
        this._id = new ObjectId();
    }
}