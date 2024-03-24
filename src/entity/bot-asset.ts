import BotAssetType from "../model/enum/bot-asset-type";
import {ObjectId} from "mongodb";

export default class BotAsset {
    declare _id: ObjectId;
    declare assetType: BotAssetType;
    declare path: string;

    constructor() {
        this._id = new ObjectId();
    }
}