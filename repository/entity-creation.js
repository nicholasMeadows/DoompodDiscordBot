module.exports = class EntityCreation {
    static guildRepository;
    static channelRepository;
    static messageRepository;
    static reactionRepository;

    static createGuildEntity(guildId, reactionHallOfDootMaxMessageAge = 2628000) {
        return {
            guildId: guildId,
            reactionHallOfDootMaxMessageAge: reactionHallOfDootMaxMessageAge,
            numberOfReactionsForHallOfDoot: 5,
            hallOfDootChannelId: ''
        }

    }
    static createChannelEntity(guildId, channelId) {
        let guild = this.guildRepository.findByGuildId(guildId);
        if(guild === undefined) {
            guild = this.createGuildEntity(guildId);
            this.guildRepository(guild);
        }
        return {
            channelId: channelId,
            guildId: guildId
        }
    }
    static createMessageEntity(messageId, channelId, guildId) {
        let guild = this.guildRepository.findByGuildId(guildId);
        if(guild === undefined) {
            guild = this.createGuildEntity(guildId);
            this.guildRepository.save(guild);
        }

        let channel = this.channelRepository.findByChannelId(channelId);
        if(channel === undefined) {
            channel = this.createChannelEntity(guildId, channelId);
            this.channelRepository.save(channel);
        }

        return {
            messageId: messageId,
            channelId: channelId,
            guildId: guildId,
            messageSentToHallOfDoot: false,
            messageReactedToWithBonkHammer: false
        }
    }
}