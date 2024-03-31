import Channel from "./channel";
import {ObjectId} from "mongodb";
import AutoReply from "./auto-reply";
import HallOfDootConfig from "./hall-of-doot-config";
import MinecraftReference from "./minecraft-reference";
import User from "./user";
import UserWalkLog from "./user-walk-log";
import ChannelCommandExecutionProfile from "./channel-command-execution-profile";

export default class Guild {
    declare _id: ObjectId;
    declare name: string;
    declare discordId: string;
    declare channels: Channel[];
    declare autoReplies: AutoReply[];
    declare hallOfDootConfig: HallOfDootConfig;
    declare minecraftReferences: MinecraftReference[];
    declare users: User[];
    declare minecraftReferenceRecord: number;
    declare userWalkLogs: UserWalkLog[];
    declare walkLoggingCompetitionResultsChannelObjectId: ObjectId;
    declare channelCommandExecutionProfiles: ChannelCommandExecutionProfile[];

    constructor() {
        this._id = new ObjectId();
    }
}