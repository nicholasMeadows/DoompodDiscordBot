import Guild from "../entity/guild";
import {Collection, ObjectId} from "mongodb";
import GuildChannelCronInfo from "../model/guild-channel-cron-info";
import AutoReplyTrigger from "../model/enum/auto-reply-trigger";
import AutoReplyInfo from "../model/auto-reply-info";
import HallOfDootConfig from "../entity/hall-of-doot-config";

export default class GuildRepository {
    declare _guildChannelMessageCollection: Collection<Guild>;

    constructor(guildChannelMessageCollection: Collection<Guild>) {
        this._guildChannelMessageCollection = guildChannelMessageCollection;
    }

    saveGuild(guild: Guild) {
        return this._guildChannelMessageCollection.updateOne({
            _id: guild._id,
            discordId: guild.discordId
        }, {
            $set: guild
        }, {
            upsert: true
        })
    }

    findGuildObjectIdByGuildDiscordId(guildDiscordId: string) {
        return this._guildChannelMessageCollection.aggregate<{
            guildObjectId: ObjectId
        }>([
            {
                $match: {
                    discordId: guildDiscordId
                }
            }, {
                $project: {
                    _id: 0,
                    guildObjectId: "$_id"
                }
            }
        ])
    }

    findAllGuildChannelCronInfo() {
        return this._guildChannelMessageCollection.aggregate<GuildChannelCronInfo>([
            {
                $match: {
                    "channels.channelCrons": {
                        $exists: true,
                        $not: {
                            $size: 0
                        }
                    }
                }
            }, {
                $unwind: {
                    path: "$channels"
                }
            }, {
                $unwind: {
                    path: "$channels.channelCrons"
                }
            }, {
                $project: {
                    "channels.messages": 0
                }
            }, {
                $lookup: {
                    from: "cron-schedule",
                    localField:
                        "channels.channelCrons.cronScheduleObjectId",
                    foreignField: "_id",
                    as: "cronSchedule"
                }
            }, {
                $unwind: {
                    path: "$cronSchedule"
                }
            }, {
                $lookup: {
                    from: "guild-sticker",
                    localField:
                        "channels.channelCrons.stickerObjectIds",
                    foreignField: "_id",
                    as: "guildStickers"
                }
            }, {
                $lookup: {
                    from: "bot-asset",
                    localField:
                        "channels.channelCrons.botAssetsObjectIds",
                    foreignField: "_id",
                    as: "bot-assets"
                }
            }, {
                $project: {
                    _id: 0,
                    guildObjectId: "$_id",
                    guildDiscordId: "$discordId",
                    channelObjectId: "$channels._id",
                    channelDiscordId: "$channels.discordId",
                    channelCron: {
                        channelCronObjectId:
                            "$channels.channelCrons._id",
                        cronAction:
                            "$channels.channelCrons.cronAction",
                        name: "$channels.channelCrons.name",
                        cronSchedule: "$cronSchedule",
                        botAssets: "$bot-assets",
                        stickers: "$guildStickers"
                    }
                }
            }
        ]);
    }

    findAutoRepliesByGuildDiscordIdAndAutoReplyTrigger(guildDiscordId: string, triggerType: AutoReplyTrigger) {
        return this._guildChannelMessageCollection.aggregate<AutoReplyInfo>([
            {
                $match: {
                    discordId: guildDiscordId
                }
            }, {
                $project: {
                    _id: 0,
                    autoReplies: 1
                }
            }, {
                $unwind: {
                    path: "$autoReplies"
                }
            }, {
                $match: {
                    "autoReplies.triggerType": triggerType
                }
            }, {
                $replaceRoot: {
                    newRoot: "$autoReplies"
                }
            }, {
                $lookup: {
                    from: "bot-asset",
                    localField: "replyWithAssets",
                    foreignField: "_id",
                    as: "replyWithAssets"
                }
            }, {
                $lookup: {
                    from: "guild-sticker",
                    localField: "replyWithStickers",
                    foreignField: "_id",
                    as: "replyWithStickers"
                }
            }
        ])
    }


    findHallOfDootConfigByGuildDiscordId(guildDiscordId: string) {
        return this._guildChannelMessageCollection.aggregate<HallOfDootConfig>([
            {
                $match: {
                    discordId: guildDiscordId
                }
            }, {
                $project: {
                    hallOfDootConfig: 1
                }
            }, {
                $replaceRoot: {
                    newRoot: "$hallOfDootConfig"
                }
            }
        ])
    }
}