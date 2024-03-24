import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "../../model/discord-client";
import {Repositories} from "../../model/mongo-db-info";

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),
    async execute(discordClient: DiscordClient, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong!");
    },
};
