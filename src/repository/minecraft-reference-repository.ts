import MinecraftReference from "../entity/minecraft-reference";
import Guild from "../entity/guild";

export default class MinecraftReferenceRepository {
    findMostRecentMinecraftReferenceByGuildId(guildId: number) {
        return MinecraftReference.findOne({
            include:[{
                model: Guild,
                required: true,
                where:[{
                    id: guildId
                }]
            }],
            order:[['createdAt', 'DESC']],
            limit: 1
        })
    }

    save(minecraftReference: MinecraftReference) {
        return minecraftReference.save();
    }
}