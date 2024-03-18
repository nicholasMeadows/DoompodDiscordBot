import Channel from "../entity/channel";

export default class ChannelRepository {
    upsert(channel: Channel) {
        return Channel.upsert(channel.dataValues, {conflictFields:['discordId'], fields:Object.keys(channel.dataValues)});
    }

    findById(id: number) {
        return Channel.findOne({
            where:[{
                id: id
            }]
        })
    }

    findByDiscordId(discordId: string) {
        return Channel.findOne({
            where:[{
                discordId: discordId
            }]
        })
    }

    save(channel: Channel) {
        return channel.save();
    }
}