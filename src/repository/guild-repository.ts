import Guild from "../entity/guild";
import User from "../entity/user";

export default class GuildRepository {
    findById(id: number) {
        return Guild.findOne({
            where:[{
                id:id
            }]
        })
    }
    findByDiscordId(discordId: string) {
        return Guild.findOne({
            where:[{
                discordId: discordId
            }]
        })
    }

    findGuildByUserAndGuildId(userDiscordId: string, guildDiscordId: string) {
        return Guild.findAll({
            where:[{
                discordId: guildDiscordId
            }],
            include:[{
                model:User,
                required: true,
                where:[{
                    discordId: userDiscordId
                }]
            }]
        })
    }

    save(guild:Guild){
        return guild.save();
    }
}