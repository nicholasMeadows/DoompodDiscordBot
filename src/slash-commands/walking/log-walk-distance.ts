import {SlashCommandBuilder} from "discord.js";
import WalkCompetitionFeature from "../../feature/walk-competition-feature";
import SlashCommandParams from "../../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("log-walk")
        .setDescription("Log how many miles you walked today!")
        .addIntegerOption(option => option
            .setName('miles')
            .setDescription('the number of miles you walked today')
            .setRequired(true)),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        const discordClient = params.discordClient;
        const repositories = params.repositories;
        await interaction.deferReply();
        const walkCompetitionFeature = new WalkCompetitionFeature(discordClient, repositories);
        const responseMsg = await walkCompetitionFeature.logWalking(interaction)
        await interaction.editReply({content: responseMsg});
    },
};
