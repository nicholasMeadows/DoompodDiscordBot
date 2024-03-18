import {Message, PartialMessage} from "discord.js";
import Channel from "../entity/channel";

export default class ChannelConverter {
    convert(message: Message | PartialMessage): Channel {
        const channel = new Channel();
        channel.discordId = message.channelId;
        return channel;
    }
}