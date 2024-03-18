import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {DOOMPOD_HUG1_2023_FILE, IMAGE_PATH} from "../../constants";
import DiscordClient from "../../model/discord-client";
import WalkCompetitionFeature from "../../feature/walk-competition-feature";

export default {
    data: new SlashCommandBuilder()
        .setName("log-walk")
        .setDescription("Log how many miles you walked today!")
        .addIntegerOption(option => option
            .setName('miles')
            .setDescription('the number of miles you walked today')
            .setRequired(true)),
    async execute(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const walkCompetitionFeature = new WalkCompetitionFeature(discordClient);
        const responseMsg = await walkCompetitionFeature.logWalking(interaction)
        interaction.editReply({content:responseMsg});
    },
};
