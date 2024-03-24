import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "../../model/discord-client";
import WalkCompetitionFeature from "../../feature/walk-competition-feature";
import {Repositories} from "../../model/mongo-db-info";

export default {
    data: new SlashCommandBuilder()
        .setName("log-walk")
        .setDescription("Log how many miles you walked today!")
        .addIntegerOption(option => option
            .setName('miles')
            .setDescription('the number of miles you walked today')
            .setRequired(true)),
    async execute(discordClient: DiscordClient, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const walkCompetitionFeature = new WalkCompetitionFeature(discordClient, repositories);
        const responseMsg = await walkCompetitionFeature.logWalking(interaction)
        interaction.editReply({content: responseMsg});
    },
};
