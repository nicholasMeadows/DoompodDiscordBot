import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {DOOMPOD_KATIE_LETS_GO_2023_FILE, IMAGE_PATH} from "../../constants";
import DiscordClient from "../../model/discord-client";
import {Repositories} from "../../model/mongo-db-info";

export default {
    data: new SlashCommandBuilder()
        .setName("doomhugcountdown")
        .setDescription("3,2,1 HUG!! circa December 2023"),
    async execute(discordClient: DiscordClient, repositories: Repositories, interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        const attachmentPath = path.join(IMAGE_PATH, DOOMPOD_KATIE_LETS_GO_2023_FILE)
        const file = new AttachmentBuilder(attachmentPath);
        interaction.editReply({files: [file]});
    },
};