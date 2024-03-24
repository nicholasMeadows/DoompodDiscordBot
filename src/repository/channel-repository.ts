import Channel from "../entity/channel";
import {Collection, ObjectId} from "mongodb";
import Guild from "../entity/guild";

export default class ChannelRepository {
    declare _guildChannelMessageCollection: Collection<Guild>;

    constructor(guildChannelMessageCollection: Collection<Guild>) {
        this._guildChannelMessageCollection = guildChannelMessageCollection;
    }

    saveChannel(guildDiscordId: string, channel: Channel) {
        return this._guildChannelMessageCollection.updateOne({
            discordId: guildDiscordId
        }, {
            $push: {channels: channel}
        })
    }

    findChannelByChannelDiscordId(channelDiscordId: string) {
        return this._guildChannelMessageCollection.aggregate<Channel>([
            {
                $match: {
                    "channels.discordId": channelDiscordId
                }
            }, {
                $project: {
                    channels: 1
                }
            }, {
                $unwind: {
                    path: "$channels"
                }
            }, {
                $match: {
                    "channels.discordId": channelDiscordId
                }
            }, {
                $replaceRoot: {
                    newRoot: "$channels"
                }
            }
        ]).limit(1);
    }

    findChannelByChannelObjectId(channelObjectId: ObjectId) {
        return this._guildChannelMessageCollection.aggregate<Channel>([
            {
                $match: {
                    "channels._id": channelObjectId
                }
            }, {
                $project: {
                    channels: 1
                }
            }, {
                $unwind: {
                    path: "$channels"
                }
            }, {
                $match: {
                    "channels._id": channelObjectId
                }
            }, {
                $replaceRoot: {
                    newRoot: "$channels"
                }
            }
        ]).limit(1);
    }
}