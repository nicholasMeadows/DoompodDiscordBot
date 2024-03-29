import {Collection, GridFSBucket, ObjectId} from "mongodb";
import Capybara from "../entity/capybara";
import Guild from "../entity/guild";
import CapybaraClaim from "../entity/capybara-claim";

export default class CapybaraRepository {
    declare _capybaraCollection: Collection<Capybara>;
    declare _capybaraGridFSBucket: GridFSBucket;
    declare _guildChannelMessageCollection: Collection<Guild>;

    constructor(capybaraCollection: Collection<Capybara>, capybaraGridFSBucket: GridFSBucket, guildChannelMessageCollection: Collection<Guild>) {
        this._capybaraCollection = capybaraCollection;
        this._capybaraGridFSBucket = capybaraGridFSBucket;
        this._guildChannelMessageCollection = guildChannelMessageCollection;
    }

    async saveCapybara(capybara: Capybara) {
        let result = await this._capybaraCollection.updateOne(
            {
                imageUrl: capybara.imageUrl,
                createdOn: capybara.createdOn
            },
            {
                $set: capybara
            }
        );

        if (result.matchedCount === 0) {
            await this._capybaraCollection.insertOne(capybara);
        }
    }

    saveCapybaraImage(fileName: string, img: Buffer): ObjectId {
        const stream = this._capybaraGridFSBucket.openUploadStream(fileName);
        stream.write(img);
        stream.end();
        return stream.id;
    }

    findCapybaraImageByObjectId(id: ObjectId) {
        return new Promise<Buffer | undefined>((resolve, reject) => {
            let bufferArray: Uint8Array[] = [];
            const downloadStream = this._capybaraGridFSBucket.openDownloadStream(id);

            downloadStream.on('data', (chunk) => {
                bufferArray.push(chunk);
            });
            downloadStream.on('error', (error) => {
                resolve(undefined);
            });
            downloadStream.on('end', () => {
                resolve(Buffer.concat(bufferArray));
            });
        })
    }

    findCapybaraByCreatedOn(startDate: Date, endDate: Date) {
        return this._capybaraCollection.aggregate<Capybara>([
            {
                $match: {
                    createdOn: {
                        $gt: startDate,
                        $lt: endDate
                    }
                }
            }
        ])
    }

    findCapybarasClaimedBetweenDatesForGuildUser(guildObjectId: ObjectId, userObjectId: ObjectId, startDate: Date, endDate: Date) {
        return this._guildChannelMessageCollection.aggregate<CapybaraClaim>([
            {
                $match: {
                    _id: guildObjectId
                }
            }, {
                $project: {
                    _id: 0,
                    users: 1
                }
            }, {
                $unwind: {
                    path: "$users"
                }
            }, {
                $match: {
                    "users._id": userObjectId,
                    "users.capybarasClaimed": {
                        $exists: true
                    }
                }
            }, {
                $project: {
                    capybarasClaimed: "$users.capybarasClaimed"
                }
            }, {
                $unwind: {
                    path: "$capybarasClaimed"
                }
            }, {
                $replaceRoot: {
                    newRoot: "$capybarasClaimed"
                }
            }, {
                $match: {
                    claimedOn: {
                        $gte: startDate,
                        $lte: endDate
                    }
                }
            }
        ]);
    }

    findRandomCapybaraForClaim(capybaraObjectIdsAlreadyClaimed: ObjectId[]) {
        return this._capybaraCollection.aggregate<Capybara>([
            {
                $match: {
                    _id: {
                        $not: {
                            $in: capybaraObjectIdsAlreadyClaimed
                        }
                    }
                }
            }, {
                $sample: {
                    size: 1
                }
            }
        ])
    }

    countCapybarasClaimedAfterDate(guildObjectId: ObjectId, userObjectId: ObjectId, date: Date) {
        return this._guildChannelMessageCollection.aggregate<{ claimedCapybaras: number }>([
            {
                $match: {
                    _id: guildObjectId
                }
            }, {
                $project: {
                    _id: 0,
                    users: 1
                }
            }, {
                $unwind: {
                    path: "$users"
                }
            }, {
                $match: {
                    "users._id": userObjectId
                }
            }, {
                $project: {
                    claimedCapybaras: "$users.capybarasClaimed"
                }
            }, {
                $unwind: {
                    path: "$claimedCapybaras"
                }
            }, {
                $match: {
                    "claimedCapybaras.claimedOn": {
                        $gt: date
                    }
                }
            }, {
                $count: "claimedCapybaras"
            }
        ])
    }

    countCapybarasClaimedBeforeDate(guildObjectId: ObjectId, userObjectId: ObjectId, date: Date) {
        return this._guildChannelMessageCollection.aggregate<{ claimedCapybaras: number }>([
            {
                $match: {
                    _id: guildObjectId
                }
            }, {
                $project: {
                    _id: 0,
                    users: 1
                }
            }, {
                $unwind: {
                    path: "$users"
                }
            }, {
                $match: {
                    "users._id": userObjectId
                }
            }, {
                $project: {
                    claimedCapybaras: "$users.capybarasClaimed"
                }
            }, {
                $unwind: {
                    path: "$claimedCapybaras"
                }
            }, {
                $match: {
                    "claimedCapybaras.claimedOn": {
                        $lt: date
                    }
                }
            }, {
                $count: "claimedCapybaras"
            }
        ])
    }

    findMostRecentCapybaraClaim(guildObjectId: ObjectId, userDiscordId: string) {
        return this._guildChannelMessageCollection.aggregate<{
            _id: ObjectId,
            claimedOn: Date,
            claimedCapybaraObjectId: ObjectId,
            capybara: Capybara
        }>([
            {
                $match: {
                    _id: guildObjectId
                }
            }, {
                $project: {
                    _id: 0,
                    users: 1
                }
            }, {
                $unwind: {
                    path: "$users"
                }
            }, {
                $match: {
                    "users.discordUserId": userDiscordId
                }
            }, {
                $project: {
                    capybarasClaimed: "$users.capybarasClaimed"
                }
            }, {
                $unwind: {
                    path: "$capybarasClaimed"
                }
            }, {
                $replaceRoot: {
                    newRoot: "$capybarasClaimed"
                }
            }, {
                $sort: {
                    claimedOn: 1
                }
            }, {
                $limit: 1
            }, {
                $lookup: {
                    from: "capybara",
                    localField: "claimedCapybaraObjectId",
                    foreignField: "_id",
                    as: "capybara"
                }
            }, {
                $unwind: {
                    path: "$capybara"
                }
            }
        ])
    }

    findMostRecentCapybaraClaimAfterDate(guildDiscordId: string, userDiscordId: string, after: Date) {
        return this._guildChannelMessageCollection.aggregate<{
            _id: ObjectId,
            claimedOn: Date,
            claimedCapybaraObjectId: ObjectId,
            capybara: Capybara
        }>([
            {
                $match: {
                    discordId: guildDiscordId
                }
            },
            {
                $project: {
                    _id: 0,
                    users: 1
                }
            },
            {
                $unwind: {
                    path: "$users"
                }
            },
            {
                $match: {
                    "users.discordUserId": userDiscordId
                }
            },
            {
                $project: {
                    capybarasClaimed: "$users.capybarasClaimed"
                }
            },
            {
                $unwind: {
                    path: "$capybarasClaimed"
                }
            },
            {
                $match: {
                    "capybarasClaimed.claimedOn": {
                        $gt: after
                    }
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$capybarasClaimed"
                }
            },
            {
                $sort: {
                    claimedOn: 1
                }
            },
            {
                $limit: 1
            },
            {
                $lookup: {
                    from: "capybara",
                    localField: "claimedCapybaraObjectId",
                    foreignField: "_id",
                    as: "capybara"
                }
            },
            {
                $unwind: {
                    path: "$capybara"
                }
            }
        ])
    }

    findMostRecentCapybaraClaimBeforeDate(guildDiscordId: string, userDiscordId: string, before: Date) {
        return this._guildChannelMessageCollection.aggregate<{
            _id: ObjectId,
            claimedOn: Date,
            claimedCapybaraObjectId: ObjectId,
            capybara: Capybara
        }>([
            {
                $match: {
                    discordId: guildDiscordId
                }
            },
            {
                $project: {
                    _id: 0,
                    users: 1
                }
            },
            {
                $unwind: {
                    path: "$users"
                }
            },
            {
                $match: {
                    "users.discordUserId": userDiscordId
                }
            },
            {
                $project: {
                    capybarasClaimed: "$users.capybarasClaimed"
                }
            },
            {
                $unwind: {
                    path: "$capybarasClaimed"
                }
            },
            {
                $match: {
                    "capybarasClaimed.claimedOn": {
                        $lt: before
                    }
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$capybarasClaimed"
                }
            },
            {
                $sort: {
                    claimedOn: 1
                }
            },
            {
                $limit: 1
            },
            {
                $lookup: {
                    from: "capybara",
                    localField: "claimedCapybaraObjectId",
                    foreignField: "_id",
                    as: "capybara"
                }
            },
            {
                $unwind: {
                    path: "$capybara"
                }
            }
        ])
    }

    findCapybaraClaimByObjectId(guildObjectId: ObjectId, userObjectId: ObjectId, claimObjectId: ObjectId) {
        return this._guildChannelMessageCollection.aggregate<CapybaraClaim>([
            {
                $match: {
                    _id: guildObjectId
                },
            }, {
                $project: {
                    _id: 0,
                    users: 1,
                },
            }, {
                $unwind: {
                    path: "$users",
                },
            }, {
                $match: {
                    "users._id": userObjectId
                },
            }, {
                $project: {
                    claims: "$users.capybarasClaimed",
                },
            }, {
                $unwind: {
                    path: "$claims",
                },
            }, {
                $match: {
                    "claims._id": claimObjectId
                },
            }, {
                $replaceRoot: {
                    newRoot: "$claims",
                },
            },
        ])
    }
}