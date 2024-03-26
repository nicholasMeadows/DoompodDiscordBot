import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {IMAGE_PATH, LEGO_SCOOBE_FILE} from "../../constants";
import DiscordClient from "../../model/discord-client";
import {Repositories} from "../../model/mongo-db-info";
import FeatureClassesObj from "../../model/feature-classes-obj";

export default {
    data: new SlashCommandBuilder()
        .setName("scoob")
        .setDescription("For when youre feeling scoob"),
    async execute(discordClient: DiscordClient, features: FeatureClassesObj, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const attachmentPath = path.join(IMAGE_PATH, LEGO_SCOOBE_FILE)
        const file = new AttachmentBuilder(attachmentPath);
        interaction.editReply({files: [file]});
    },
};
