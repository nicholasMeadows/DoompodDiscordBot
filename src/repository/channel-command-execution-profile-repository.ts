import {Collection, ObjectId} from "mongodb";
import Guild from "../entity/guild";
import BotCommand from "../entity/bot-command";

export default class ChannelCommandExecutionProfileRepository {
    declare _guildChannelMessageCollection: Collection<Guild>;
    declare _botCommandCollection: Collection<BotCommand>;

    constructor(guildChannelMessageCollection: Collection<Guild>, botCommandCollection: Collection<BotCommand>) {
        this._guildChannelMessageCollection = guildChannelMessageCollection;
        this._botCommandCollection = botCommandCollection;
    }

    findExecutionProfile(commandDiscordId: string, guildDiscordId: string) {
        return this._botCommandCollection.aggregate<{
            _id: ObjectId,
            commandName: string,
            discordId: string,
            commandDescription: string,
            executionProfile: {
                _id: ObjectId
                botCommandObjectId: ObjectId,
                allowedChannelDiscordIds: string[],
                notAllowedChannelDiscordIds: string[]
            }
        }>([
            {
                $match: {
                    discordId: commandDiscordId
                }
            }, {
                $lookup: {
                    from: "guild-channel-message",
                    as: "executionProfile",
                    let: {
                        botCommandObjectId: "$_id"
                    },
                    pipeline: [
                        {
                            $match: {
                                discordId: guildDiscordId
                            }
                        }, {
                            $project: {
                                channelCommandExecutionProfiles: 1
                            }
                        }, {
                            $unwind: {
                                path: "$channelCommandExecutionProfiles"
                            }
                        }, {
                            $replaceRoot: {
                                newRoot:
                                    "$channelCommandExecutionProfiles"
                            }
                        }, {
                            $match: {
                                $expr: {
                                    $eq: [
                                        "$botCommandObjectId",
                                        "$$botCommandObjectId"
                                    ]
                                }
                            }
                        }
                    ]
                }
            }, {
                $unwind: {
                    path: "$executionProfile"
                }
            }, {
                $limit: 1
            }
        ]);
    }
}