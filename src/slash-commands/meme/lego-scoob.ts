import {AttachmentBuilder, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {IMAGE_PATH, LEGO_SCOOBE_FILE} from "../../constants";
import SlashCommandParams from "../../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("scoob")
        .setDescription("For when youre feeling scoob"),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        await interaction.deferReply();
        const attachmentPath = path.join(IMAGE_PATH, LEGO_SCOOBE_FILE)
        const file = new AttachmentBuilder(attachmentPath);
        await interaction.editReply({files: [file]});
    },
};
