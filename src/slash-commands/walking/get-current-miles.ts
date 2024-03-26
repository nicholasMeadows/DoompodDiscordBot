import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "../../model/discord-client";
import WalkCompetitionFeature from "../../feature/walk-competition-feature";
import {Repositories} from "../../model/mongo-db-info";
import FeatureClassesObj from "../../model/feature-classes-obj";

export default {
    data: new SlashCommandBuilder()
        .setName("my-miles")
        .setDescription("Prints out how many miles youve walked this month"),
    async execute(discordClient: DiscordClient, features: FeatureClassesObj, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const walkCompetitionFeature = new WalkCompetitionFeature(discordClient, repositories);
        const responseMsg = await walkCompetitionFeature.myMiles(interaction)
        interaction.editReply({content: responseMsg});
    },
};
