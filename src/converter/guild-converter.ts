import {ChatInputCommandInteraction} from "discord.js";
import Guild from "../entity/guild";

export default class GuildConverter {
    convert(discordId: string) {
        const guild = new Guild();
        guild.discordId = discordId;
        return guild;
    }
}