import {Message, PartialMessage, PartialMessageReaction} from "discord.js";
import ChannelMessage from "../entity/channel-message";
import Channel from "../entity/channel";
import AutoReply from "../entity/auto-reply";

export default class ChannelMessageConverter {

    convert(message: Message | PartialMessage) {
        const channelMessage = new ChannelMessage();
        channelMessage.discordId = message.id;
        channelMessage.sentToHallOfDoot = false;
        return channelMessage;
    }

}