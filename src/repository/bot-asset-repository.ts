import {Collection} from "mongodb";
import BotAsset from "../entity/bot-asset";

export default class BotAssetRepository {
    private _botAssetCollection: Collection<BotAsset>;

    constructor(botAssetCollection: Collection<BotAsset>) {
        this._botAssetCollection = botAssetCollection;
    }

    saveBotAsset(botAsset: BotAsset) {
        return this._botAssetCollection.updateOne({
            _id: botAsset._id
        }, {
            $set: botAsset
        }, {
            upsert: true
        })
    }
}