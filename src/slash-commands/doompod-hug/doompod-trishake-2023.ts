import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {DOOMPOD_TRISHAKE_2023_FILE, IMAGE_PATH} from "../../constants";
import DiscordClient from "../../model/discord-client";
import {Repositories} from "../../model/mongo-db-info";

export default {
    data: new SlashCommandBuilder()
        .setName("trishake")
        .setDescription("The trinity known as tri-shake circa December 2023"),
    async execute(discordClient: DiscordClient, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const attachmentFile = path.join(IMAGE_PATH, DOOMPOD_TRISHAKE_2023_FILE);
        const file = new AttachmentBuilder(attachmentFile);
        interaction.editReply({files: [file]});
    },
};
