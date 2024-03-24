import Message from "../entity/message";
import {Collection, ObjectId} from "mongodb";
import Guild from "../entity/guild";

export default class MessageRepository {
    declare _guildChannelMessageCollection: Collection<Guild>;

    constructor(guildChannelMessageCollection: Collection<Guild>) {
        this._guildChannelMessageCollection = guildChannelMessageCollection;
    }

    saveMessage(guildDiscordId: string, channelDiscordId: string, message: Message) {
        return this._guildChannelMessageCollection.updateOne({
            "discordId": guildDiscordId,
            "channels.discordId": channelDiscordId
        }, {
            $set: {
                "channels.$.messages": message
            }
        }, {
            upsert: true
        })
    }

    findMessageByGuildChannelMessageReactionId(guildDiscordId: string, channelDiscordId: string, messageDiscordId: string, autoReplyObjectId: ObjectId) {
        return this._guildChannelMessageCollection.aggregate<Message>([
            {
                $match: {
                    discordId: guildDiscordId
                }
            },
            {
                $unwind: {
                    path: "$channels"
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$channels"
                }
            },
            {
                $match: {
                    discordId: channelDiscordId
                }
            },
            {
                $unwind: {
                    path: "$messages"
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$messages"
                }
            },
            {
                $match: {
                    discordId: messageDiscordId,
                    repliedToByAutoReplyObjectIds: autoReplyObjectId
                }
            }
        ])
    }

    findMessageByGuildChannelMessageId(guildDiscordId: string, channelDiscordId: string, messageDiscordId: string) {
        return this._guildChannelMessageCollection.aggregate<Message>([
            {
                $match: {
                    discordId: guildDiscordId
                }
            },
            {
                $unwind: {
                    path: "$channels"
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$channels"
                }
            },
            {
                $match: {
                    discordId: channelDiscordId
                }
            },
            {
                $unwind: {
                    path: "$messages"
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$messages"
                }
            },
            {
                $match: {
                    discordId: messageDiscordId
                }
            }
        ])
    }
}