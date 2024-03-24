import CronSchedule from "../entity/cron-schedule";
import {Collection} from "mongodb";

export default class CronScheduleRepository {
    declare _cronScheduleCollection: Collection<CronSchedule>;

    constructor(cronScheduleCollection: Collection<CronSchedule>) {
        this._cronScheduleCollection = cronScheduleCollection;
    }

    saveCronSchedule(cronSchedule: CronSchedule) {
        return this._cronScheduleCollection.updateOne({
            _id: cronSchedule._id
        }, {
            $set: cronSchedule
        }, {
            upsert: true
        })
    }
}