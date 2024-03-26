import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {DOOMPOD_HUG2_2023_FILE, IMAGE_PATH} from "../../constants";
import DiscordClient from "../../model/discord-client";
import {Repositories} from "../../model/mongo-db-info";
import FeatureClassesObj from "../../model/feature-classes-obj";

export default {
    data: new SlashCommandBuilder()
        .setName("doomhug2")
        .setDescription(
            "Our very first Doom-pod hug but more different circa December 2023"
        ),
    async execute(discordClient: DiscordClient, features: FeatureClassesObj, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const attachmentPath = path.join(IMAGE_PATH, DOOMPOD_HUG2_2023_FILE);
        const file = new AttachmentBuilder(attachmentPath);
        interaction.editReply({files: [file]});
    },
};
