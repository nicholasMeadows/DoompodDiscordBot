import {ObjectId} from "mongodb";

export default class Capybara {
    declare _id: ObjectId;
    declare name: string;
    declare imageUrl: string;
    declare muncherLvl: number;
    declare weapon: string;
    declare class: string;
    declare used: string;
    declare relationshipStatus: string;
    declare daysAgo: number;
    declare createdOn: Date;
    declare imageObjectId: ObjectId;

    constructor() {
        this._id = new ObjectId();
        this.createdOn = new Date();
    }
}