const BaseRepository = require('./base-repository')
module.exports = class ChannelRepository extends BaseRepository {
    constructor(configService) {
        super(configService);
    }

    findByChannelId(channelId) {
        const channels = super.readDBFile().channels;
        return channels.find(channel => channel.channelId === channelId);
    }

    save(channelEntity) {
        const db = super.readDBFile();
        const channels = db.channels;
        const channelIndex = channels.findIndex(channel => channel.channelId === channelEntity.channelId);
        if(channelIndex !== -1) {
            channels.splice(channelIndex, 1);
        }

        channels.push(channelEntity);
        super.writeDBToFile(db);
    }
}