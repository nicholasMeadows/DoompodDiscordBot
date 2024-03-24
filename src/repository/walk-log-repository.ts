import {Collection, ObjectId} from "mongodb";
import User from "../entity/user";
import UserWalkLog from "../entity/user-walk-log";
import Guild from "../entity/guild";

export default class WalkLogRepository {
    declare _guildChannelMessageCollection: Collection<Guild>;

    constructor(guildChannelMessageCollection: Collection<Guild>) {
        this._guildChannelMessageCollection = guildChannelMessageCollection;
    }

    insertUserWalkLog(guildObjectId: ObjectId, userWalkLog: UserWalkLog) {
        return this._guildChannelMessageCollection.updateOne({
            _id: guildObjectId
        }, {
            $push: {userWalkLogs: userWalkLog}
        })
    }

    findTotalMilesForMonthForUser(guildObjectId: ObjectId, userObjectId: ObjectId, start: Date, end: Date) {
        return this._guildChannelMessageCollection.aggregate<{ totalMiles: number }>([
            {
                $match: {
                    _id: guildObjectId
                }
            },
            {
                $project: {
                    _id: 0,
                    userWalkLogs: 1
                }
            },
            {
                $unwind: {
                    path: "$userWalkLogs"
                }
            },
            {
                $match: {
                    "userWalkLogs.user": userObjectId
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$userWalkLogs"
                }
            },
            {
                $match: {
                    createdAt: {
                        $gte: start,
                        $lt: end
                    }
                }
            },
            {
                $group: {
                    _id: {
                        user: userObjectId
                    },
                    totalMiles: {
                        $sum: "$milesLogged"
                    }
                }
            }
        ])
    }

    findTopWalkersForMonth(guildObjectId: ObjectId, startDate: Date, endDate: Date) {
        return this._guildChannelMessageCollection.aggregate<{ user: User, totalMiles: number }>([
            {
                $match: {
                    _id: guildObjectId
                }
            }, {
                $project: {
                    _id: 0,
                    userWalkLogs: 1
                }
            }, {
                $unwind: {
                    path: "$userWalkLogs"
                }
            }, {
                $replaceRoot: {
                    newRoot: "$userWalkLogs"
                }
            }, {
                $match: {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            }, {
                $group: {
                    _id: {
                        user: "$user"
                    },
                    totalMiles: {
                        $sum: "$milesLogged"
                    }
                }
            }, {
                $lookup: {
                    from: "guild-channel-message",
                    as: "user",
                    let: {user: "$user._id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {$eq: ["$$user", "$_id.user"]},
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                users: 1,
                            },
                        },
                        {
                            $unwind: {
                                path: "$users",
                            },
                        },
                    ],
                }
            }, {
                $sort: {
                    totalMiles: -1
                }
            }, {
                $limit: 3
            }, {
                $unwind: {
                    path: "$user"
                }
            }, {
                $project: {
                    _id: 0,
                    user: "$user.users",
                    totalMiles: 1
                }
            }
        ])
    }

    findWalkLogMonthResultsChannelForGuildObjectId(guildObjectId: ObjectId) {
        return this._guildChannelMessageCollection.aggregate<{ discordId: string }>([
            {
                $match: {
                    _id: guildObjectId
                }
            },
            {
                $project: {
                    _id: 0,
                    channels: 1,
                    walkLoggingCompetitionResultsChannelObjectId: 1
                }
            },
            {
                $unwind: {
                    path: "$channels"
                }
            },
            {
                $match: {
                    $expr: {
                        $eq: [
                            "$channels._id",
                            "$walkLoggingCompetitionResultsChannelObjectId"
                        ]
                    }
                }
            },
            {
                $replaceRoot: {
                    newRoot: "$channels"
                }
            },
            {
                $project: {
                    _id: 0,
                    discordId: 1
                }
            }
        ]);
    }
}