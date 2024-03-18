import HallOfDootConfig from "../entity/hall-of-doot-config";
import Guild from "../entity/guild";

export default class HallOfDootConfigRepository {
    findByGuildDiscordId(guildDiscordId: string) {
        return HallOfDootConfig.findOne({
            include:[{
                model: Guild,
                required: true,
                where:[{
                    discordId: guildDiscordId
                }]
            }]
        })
    }
}