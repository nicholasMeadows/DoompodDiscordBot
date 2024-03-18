import ChannelMessage from "../entity/channel-message";
import AutoReply from "../entity/auto-reply";
import ChannelMessageConverter from "../converter/channel-message-converter";

export default class ChannelMessageRepository {
    findByDiscordIdAndAutoReplyId(messageDiscordId: string, autoReplyId: number) {
        return ChannelMessage.findAll({
            where:[{
                discordId: messageDiscordId
            }],
            include:[{
                model: AutoReply,
                required: true,
                where:[{
                    id: autoReplyId
                }]
            }]
        })
    }

    upsert(channelMessage: ChannelMessage) {
        return ChannelMessage.upsert(channelMessage.dataValues, {conflictFields:['discordId']})
    }

    findByMessageDiscordIdAndChannelId(messageDiscordId: string, channelId: number) {
        return ChannelMessage.findOne({
            where:[{
                discordId: messageDiscordId,
                channelId: channelId
            }]
        })
    }

    save(channelMessage: ChannelMessage) {
        return channelMessage.save();
    }
}
