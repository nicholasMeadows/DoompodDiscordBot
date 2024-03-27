import {SlashCommandBuilder} from "discord.js";
import WalkCompetitionFeature from "../../feature/walk-competition-feature";
import SlashCommandParams from "../../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("walking-top-3")
        .setDescription("Prints out the current standings for the month"),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        const discordClient = params.discordClient;
        const repositories = params.repositories;
        await interaction.deferReply();
        const walkCompetitionFeature = new WalkCompetitionFeature(discordClient, repositories);
        const responseMsg = await walkCompetitionFeature.getTop3AlongWithMyMiles(interaction);
        interaction.editReply({content: responseMsg});
    },
};
