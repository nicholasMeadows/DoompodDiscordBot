import {Collection, ObjectId, UpdateResult} from "mongodb";
import User from "../entity/user";
import Guild from "../entity/guild";

export default class UserRepository {
    declare _guildChannelMessageCollection: Collection<Guild>;

    constructor(guildChannelMessageCollection: Collection<Guild>) {
        this._guildChannelMessageCollection = guildChannelMessageCollection;
    }

    findGuildUser(guildObjectId: ObjectId, userDiscordId: string) {
        return this._guildChannelMessageCollection.aggregate<User>([
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
                $replaceRoot: {
                    newRoot: "$users"
                }
            }
        ])
    }

    saveGuildUser(guildObjectId: ObjectId, user: User): Promise<UpdateResult<Guild>> {
        return new Promise(async (resolve) => {
            await this._guildChannelMessageCollection.updateOne({
                _id: guildObjectId
            }, {
                $pull: {
                    'users': {
                        discordUserId: user.discordUserId
                    }
                }
            });

            const result = await this._guildChannelMessageCollection.updateOne({
                _id: guildObjectId
            }, {
                $push: {
                    users: user
                }
            });
            resolve(result);
        })
    }
}