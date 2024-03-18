import User from "../entity/user";
import Channel from "../entity/channel";
import Guild from "../entity/guild";

export default class UserRepository {

    findById(id: number) {
        return User.findOne({
            where:[{
                id:id
            }]
        });
    }
    findByDiscordId(discordId: string) {
        return User.findOne({
            where:[{
                discordId: discordId
            }]
        });
    }

    findByUserDiscordIdAndGuildId(userDiscordId: string, guildId: number) {
        return User.findOne({
            where:[{
                discordId: userDiscordId
            }],
            include:[{
                model:Guild,
                required: true,
                where:[{
                    id: guildId
                }]
            }]
        })
    }

    save(user: User) {
        return user.save();
    }
}