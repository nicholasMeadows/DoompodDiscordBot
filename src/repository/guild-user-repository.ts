import GuildUser from "../entity/guild-user";

export default class GuildUserRepository {
    async  save(guildUser: GuildUser) {
        return await guildUser.save();
    }
}