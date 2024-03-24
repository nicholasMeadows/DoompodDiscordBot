import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import DiscordClient from "../../model/discord-client";
import WalkCompetitionFeature from "../../feature/walk-competition-feature";
import {Repositories} from "../../model/mongo-db-info";

export default {
    data: new SlashCommandBuilder()
        .setName("walking-top-3")
        .setDescription("Prints out the current standings for the month"),
    async execute(discordClient: DiscordClient, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const walkCompetitionFeature = new WalkCompetitionFeature(discordClient, repositories);
        const responseMsg = await walkCompetitionFeature.getTop3AlongWithMyMiles(interaction);
        interaction.editReply({content: responseMsg});
    },
};
