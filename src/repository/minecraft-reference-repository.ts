import {Collection, ObjectId} from "mongodb";
import MinecraftReference from "../entity/minecraft-reference";
import Guild from "../entity/guild";

export class MinecraftReferenceRepository {
    declare _guildChannelMessageCollection: Collection<Guild>;

    constructor(guildChannelMessageCollection: Collection<Guild>) {
        this._guildChannelMessageCollection = guildChannelMessageCollection;
    }

    findMostRecentMinecraftReference(guildObjectId: ObjectId) {
        return this._guildChannelMessageCollection.aggregate<MinecraftReference>([
            {
                $match: {
                    _id: guildObjectId
                }
            }, {
                $project: {
                    _id: 0,
                    minecraftReferences: 1
                }
            }, {
                $unwind: {
                    path: "$minecraftReferences"
                }
            }, {
                $replaceRoot: {
                    newRoot: "$minecraftReferences"
                }
            }, {
                $sort: {
                    referenceMadeTimestamp: -1
                }
            }, {
                $limit: 1
            }
        ])
    }

    findMinecraftReferenceRecord(guildObjectId: ObjectId) {
        return this._guildChannelMessageCollection.aggregate<{ minecraftReferenceRecord: number }>([
            {
                $match: {
                    _id: guildObjectId
                }
            },
            {
                $project: {
                    _id: 0,
                    minecraftReferenceRecord: 1
                }
            }
        ])
    }

    saveMinecraftReferenceRecord(guildObjectId: ObjectId, referenceRecord: number) {
        return this._guildChannelMessageCollection.updateOne({
            _id: guildObjectId
        }, {
            $set: {
                minecraftReferenceRecord: referenceRecord
            }
        })
    }

    saveMinecraftReference(guildObjectId: ObjectId, minecraftReference: MinecraftReference) {
        return this._guildChannelMessageCollection.updateOne({
            _id: guildObjectId
        }, {
            $push: {minecraftReferences: minecraftReference}
        })
    }
}