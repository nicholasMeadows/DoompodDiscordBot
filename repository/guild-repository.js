const BaseRepository = require('./base-repository')
module.exports = class GuildRepository extends BaseRepository{
    constructor(configService) {
        super(configService);
    }

    findByGuildId(guildId) {
        const guilds = super.readDBFile().guilds;
        return guilds.find(guild=> guild.guildId === guildId);
    }

    save(guildEntity) {
        const db = super.readDBFile();
        const guilds = db.guilds;
        const guildIndex = guilds.findIndex(guild => guild.guildId === guildEntity.guildId);
        if(guildIndex !== -1) {
            guilds.splice(guildIndex, 1);
        }

        guilds.push(guildEntity);
        super.writeDBToFile(db);
    }
}