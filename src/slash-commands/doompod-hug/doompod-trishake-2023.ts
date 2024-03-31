import {AttachmentBuilder, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {DOOMPOD_TRISHAKE_2023_FILE, IMAGE_PATH} from "../../constants";
import SlashCommandParams from "../../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("trishake")
        .setDescription("The trinity known as tri-shake circa December 2023"),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        if (!interaction.deferred) {
            await interaction.deferReply();
        }
        const attachmentFile = path.join(IMAGE_PATH, DOOMPOD_TRISHAKE_2023_FILE);
        const file = new AttachmentBuilder(attachmentFile);
        await interaction.editReply({files: [file]});
    },
};
