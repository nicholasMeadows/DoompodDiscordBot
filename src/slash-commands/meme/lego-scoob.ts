import {AttachmentBuilder, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import path from "node:path";
import {DOOMPOD_HUG1_2023_FILE, IMAGE_PATH, LEGO_SCOOBE_FILE} from "../../constants";
import DiscordClient from "../../model/discord-client";

export default {
  data: new SlashCommandBuilder()
    .setName("scoob")
    .setDescription("For when youre feeling scoob"),
  async execute(discordClient: DiscordClient, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const attachmentPath = path.join(IMAGE_PATH, LEGO_SCOOBE_FILE)
    const file = new AttachmentBuilder(attachmentPath);
    interaction.editReply({ files: [file] });
  },
};
