import {ObjectId} from "mongodb";
import CapybaraClaim from "./capybara-claim";

export default class User {
    declare _id: ObjectId;
    declare discordUserId: string;
    declare capybarasClaimed: CapybaraClaim[];
    declare myCapybarasLastClaimedObjectId: ObjectId;

    constructor() {
        this._id = new ObjectId();
    }
}