import AutoReply from "../entity/auto-reply";
import AutoReplyTrigger from "../model/enum/auto-reply-trigger";
import ChannelMessage from "../entity/channel-message";
import Guild from "../entity/guild";

export default class AutoReplyRepository {
    findByGuildIdAndTriggerType(guildId: number, triggerType: AutoReplyTrigger){
        return AutoReply.findAll({
            where:[{
                triggerType: triggerType
            }],
            include:[{
                model:Guild,
                required: true,
                where:[{
                    id:guildId
                }]
            }]
        })
    }
}