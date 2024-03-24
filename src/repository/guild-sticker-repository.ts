import {Collection} from "mongodb";
import Sticker from "../entity/sticker";

export default class GuildStickerRepository {
    declare _stickerCollection: Collection<Sticker>

    constructor(stickerCollection: Collection<Sticker>) {
        this._stickerCollection = stickerCollection;
    }

    saveSticker(sticker: Sticker) {
        return this._stickerCollection.updateOne({
            _id: sticker._id,
            guildObjectId: sticker.guildObjectId
        }, {
            $set: sticker
        }, {
            upsert: true
        })
    }
}