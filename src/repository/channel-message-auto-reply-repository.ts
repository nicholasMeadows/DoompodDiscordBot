import ChannelMessageAutoReply from "../entity/channel-message-auto-reply";

export default class ChannelMessageAutoReplyRepository{
    upsert(channelMessageAutoReply: ChannelMessageAutoReply) {
        return ChannelMessageAutoReply.upsert(channelMessageAutoReply.dataValues)
    }
}