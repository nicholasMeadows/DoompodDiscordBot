import {CacheType, ChatInputCommandInteraction, Interaction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "../../model/discord-client";

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),
    async execute(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong!");
    },
};
