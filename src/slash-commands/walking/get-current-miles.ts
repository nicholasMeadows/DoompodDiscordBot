import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {DOOMPOD_HUG1_2023_FILE, IMAGE_PATH} from "../../constants";
import DiscordClient from "../../model/discord-client";
import WalkCompetitionFeature from "../../feature/walk-competition-feature";

export default {
    data: new SlashCommandBuilder()
        .setName("my-miles")
        .setDescription("Prints out how many miles youve walked this month"),
    async execute(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const walkCompetitionFeature = new WalkCompetitionFeature(discordClient);
        const responseMsg = await walkCompetitionFeature.myMiles(interaction)
        interaction.editReply({content:responseMsg});
    },
};
