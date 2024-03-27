import {AttachmentBuilder, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {DOOMPOD_HUG2_2023_FILE, IMAGE_PATH} from "../../constants";
import SlashCommandParams from "../../model/slash-command-params";

export default {
    data: new SlashCommandBuilder()
        .setName("doomhug2")
        .setDescription(
            "Our very first Doom-pod hug but more different circa December 2023"
        ),
    async execute(params: SlashCommandParams) {
        const interaction = params.interaction;
        await interaction.deferReply();
        const attachmentPath = path.join(IMAGE_PATH, DOOMPOD_HUG2_2023_FILE);
        const file = new AttachmentBuilder(attachmentPath);
        interaction.editReply({files: [file]});
    },
};
